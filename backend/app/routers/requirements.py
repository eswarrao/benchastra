from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import User, Requirement, Resource, Match
from app.schemas import RequirementCreate, RequirementUpdate, RequirementResponse, MatchResponse
from app.dependencies import get_current_user, get_current_client
from app.utils.helpers import generate_requirement_id
from fastapi import UploadFile, File
import pandas as pd
import io
import re
import time

router = APIRouter(prefix="/requirements", tags=["Requirements"])

@router.post("/bulk-upload")
async def bulk_upload_requirements(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    try:
        # Read the file
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:  # Excel file
            df = pd.read_excel(io.BytesIO(contents))
        
        # Strip any whitespace from column names
        df.columns = df.columns.str.strip()
        
        requirements_created = []
        # Use a set to track generated IDs to avoid duplicates
        used_ids = set()
        
        for _, row in df.iterrows():
            # Helper function to safely get value
            def safe_get(key, default=None):
                val = row.get(key, default)
                return default if pd.isna(val) else val
            
            # Parse skills - handle both comma-separated and list format
            skills_val = safe_get('skills', '')
            if isinstance(skills_val, str):
                skills = [s.strip() for s in skills_val.split(',') if s.strip()]
            elif isinstance(skills_val, list):
                skills = skills_val
            else:
                skills = []
            
            # Parse experience values
            exp_min = safe_get('experience_min')
            exp_max = safe_get('experience_max')
            
            try:
                exp_min = int(float(exp_min)) if exp_min is not None else None
            except (ValueError, TypeError):
                exp_min = None
                
            try:
                exp_max = int(float(exp_max)) if exp_max is not None else None
            except (ValueError, TypeError):
                exp_max = None
            
            # Parse positions
            positions_val = safe_get('positions', 1)
            try:
                positions = int(float(positions_val)) if positions_val is not None else 1
            except (ValueError, TypeError):
                positions = 1
            
            # Parse budget values
            budget_min = safe_get('budget_min')
            budget_max = safe_get('budget_max')
            
            try:
                budget_min = float(budget_min) if budget_min is not None else None
            except (ValueError, TypeError):
                budget_min = None
                
            try:
                budget_max = float(budget_max) if budget_max is not None else None
            except (ValueError, TypeError):
                budget_max = None
            
            # Get string values
            role = safe_get('role', '')
            duration = safe_get('duration', '6 Months')
            work_mode = safe_get('work_mode', 'Remote')
            start_date = safe_get('start_date', 'Immediate')
            location = safe_get('location', '')
            description = safe_get('description', '')
            
            # Generate unique requirement_id with retry logic
            req_id = generate_unique_id(used_ids)
            used_ids.add(req_id)
            
            # Create requirement
            requirement = Requirement(
                requirement_id=req_id,
                client_id=current_user.id,
                role=str(role) if role else 'Untitled Role',
                experience_min=exp_min,
                experience_max=exp_max,
                positions=positions,
                skills=skills,
                budget_min=budget_min,
                budget_max=budget_max,
                duration=str(duration),
                work_mode=str(work_mode),
                start_date=str(start_date),
                location=str(location) if location else None,
                description=str(description) if description else None,
                status="Open"
            )
            db.add(requirement)
            requirements_created.append(requirement)
        
        # Commit in batches to avoid memory issues
        db.commit()
        
        # Generate matches for each requirement
        for req in requirements_created:
            match_resources(req, db)
        
        # Commit matches
        db.commit()
        
        return {"message": f"Successfully created {len(requirements_created)} requirements", "count": len(requirements_created)}
    
    except Exception as e:
        db.rollback()
        print(f"Error in bulk upload: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

def generate_unique_id(used_ids: set) -> str:
    """Generate a unique requirement_id that is not in the used_ids set"""
    max_attempts = 100
    for _ in range(max_attempts):
        req_id = generate_requirement_id()
        if req_id not in used_ids:
            return req_id
        # Add a small delay to ensure different timestamp if the generator uses time
        time.sleep(0.001)
    
    # Fallback: use timestamp + random suffix
    import random
    return f"REQ{int(time.time() * 1000)}{random.randint(10, 99)}"

@router.get("/", response_model=List[RequirementResponse])
def get_requirements(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Requirement)
    
    if current_user.role == "client":
        query = query.filter(Requirement.client_id == current_user.id)
    
    if status and status.lower() != "all":
        from sqlalchemy import func as sqlfunc
        query = query.filter(sqlfunc.lower(Requirement.status) == status.lower())
    
    requirements = query.order_by(Requirement.created_at.desc()).offset(skip).limit(limit).all()
    
    for req in requirements:
        matches_count = db.query(Match).filter(Match.requirement_id == req.id).count()
        req.matches_count = matches_count
    
    return requirements

@router.get("/{requirement_id}", response_model=RequirementResponse)
def get_requirement(
    requirement_id: int, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    if current_user.role == "client" and requirement.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this requirement")
    
    matches_count = db.query(Match).filter(Match.requirement_id == requirement_id).count()
    requirement.matches_count = matches_count
    
    return requirement

@router.post("/", response_model=RequirementResponse)
def create_requirement(
    requirement: RequirementCreate,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    requirement_id = generate_requirement_id()
    
    db_requirement = Requirement(
        requirement_id=requirement_id,
        client_id=current_user.id,
        role=requirement.role,
        experience_min=requirement.experience_min,
        experience_max=requirement.experience_max,
        positions=requirement.positions,
        skills=requirement.skills,
        must_have_skills=requirement.must_have_skills,
        good_to_have_skills=requirement.good_to_have_skills,
        budget_min=requirement.budget_min,
        budget_max=requirement.budget_max,
        duration=requirement.duration,
        work_mode=requirement.work_mode,
        start_date=requirement.start_date,
        custom_start_date=requirement.custom_start_date,
        location=requirement.location,
        description=requirement.description,
        status="Open"
    )
    
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    
    match_resources(db_requirement, db)
    
    matches_count = db.query(Match).filter(Match.requirement_id == db_requirement.id).count()
    db_requirement.matches_count = matches_count
    
    return db_requirement

@router.put("/{requirement_id}", response_model=RequirementResponse)
def update_requirement(
    requirement_id: int,
    requirement: RequirementUpdate,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    db_requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    if db_requirement.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this requirement")
    
    update_data = requirement.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_requirement, field, value)
    
    db.commit()
    db.refresh(db_requirement)
    
    # Recalculate matches
    db.query(Match).filter(Match.requirement_id == requirement_id).delete()
    match_resources(db_requirement, db)
    
    matches_count = db.query(Match).filter(Match.requirement_id == requirement_id).count()
    db_requirement.matches_count = matches_count
    
    return db_requirement

@router.delete("/{requirement_id}")
def delete_requirement(
    requirement_id: int,
    current_user: User = Depends(get_current_client),
    db: Session = Depends(get_db)
):
    db_requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    if db_requirement.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this requirement")
    
    db.query(Match).filter(Match.requirement_id == requirement_id).delete()
    db.delete(db_requirement)
    db.commit()
    
    return {"message": "Requirement deleted successfully"}

@router.get("/{requirement_id}/matches", response_model=List[MatchResponse])
def get_requirement_matches(
    requirement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if requirement exists
    requirement = db.query(Requirement).filter(Requirement.id == requirement_id).first()
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Get matches
    matches = db.query(Match).filter(Match.requirement_id == requirement_id).all()
    
    result = []
    for match in matches:
        resource = db.query(Resource).filter(Resource.id == match.resource_id).first()
        if resource:
            result.append(MatchResponse(
                id=match.id,
                requirement_id=requirement.requirement_id,
                resource_id=resource.resource_id,
                match_score=match.match_score,
                status=match.status,
                resource_name=resource.name,
                resource_skills=resource.skills or [],
                resource_experience=resource.experience or "",
                resource_availability=resource.availability or "",
                resource_rate=resource.base_rate or 0,
                requirement_role=requirement.role
            ))
    
    return result

@router.put("/matches/{match_id}/status")
def update_match_status(
    match_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    match.status = status
    db.commit()
    
    return {"message": f"Match status updated to {status}"}

def match_resources(requirement: Requirement, db: Session):
    """Match resources based on role, skills, and experience"""
    resources = db.query(Resource).filter(Resource.status == "Available").all()
    
    for resource in resources:
        score = calculate_match_score(requirement, resource)
        if score >= 50:  # Lowered threshold to get more matches
            existing_match = db.query(Match).filter(
                Match.requirement_id == requirement.id,
                Match.resource_id == resource.id
            ).first()
            
            if not existing_match:
                match = Match(
                    requirement_id=requirement.id,
                    resource_id=resource.id,
                    match_score=score
                )
                db.add(match)
    
    db.commit()

def normalize_text(text: str) -> str:
    """Normalize text for comparison"""
    if not text:
        return ""
    # Convert to lowercase and remove special characters
    text = text.lower().strip()
    # Remove common words
    text = re.sub(r'\b(engineer|developer|architect|specialist|consultant|analyst|manager|lead|senior|junior|staff|principal|expert)\b', '', text)
    # Remove extra spaces
    text = ' '.join(text.split())
    return text

def calculate_match_score(requirement: Requirement, resource: Resource) -> int:
    """Calculate match score based on role, skills, and experience"""
    score = 0
    max_score = 100
    
    # 1. ROLE MATCHING (40 points)
    if requirement.role and resource.skill_domain:
        req_role_normalized = normalize_text(requirement.role)
        res_role_normalized = normalize_text(resource.skill_domain)
        
        # Check if roles match
        req_words = set(req_role_normalized.split())
        res_words = set(res_role_normalized.split())
        
        if req_words and res_words:
            # Check for exact word matches
            common_words = req_words.intersection(res_words)
            if common_words:
                # If there's at least one common word, give 30 points
                score += 30
                # If more than one common word, give extra points
                if len(common_words) >= 2:
                    score += 10
            else:
                # Check if one is a substring of the other
                if req_role_normalized in res_role_normalized or res_role_normalized in req_role_normalized:
                    score += 20
        
        # Check for related roles using keyword matching
        role_keywords = {
            'devops': ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker', 'terraform', 'jenkins', 'ci/cd', 'pipeline'],
            'java': ['spring', 'hibernate', 'j2ee', 'microservices', 'maven', 'gradle'],
            'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy', 'scikit-learn'],
            'react': ['frontend', 'javascript', 'typescript', 'redux', 'next.js', 'tailwind'],
            'node': ['javascript', 'express', 'nestjs', 'backend', 'api'],
            'full stack': ['frontend', 'backend', 'react', 'node', 'angular', 'vue', 'python', 'java'],
            'data engineer': ['pyspark', 'hadoop', 'kafka', 'airflow', 'data pipeline', 'etl', 'warehouse'],
            'data scientist': ['machine learning', 'deep learning', 'nlp', 'computer vision', 'python', 'r'],
            'backend': ['java', 'spring', 'python', 'django', 'node', 'express', 'microservices', 'api'],
            'frontend': ['react', 'angular', 'vue', 'javascript', 'typescript', 'html', 'css']
        }
        
        # Check if requirement role matches any keywords in resource role
        for req_keyword, related_keywords in role_keywords.items():
            if req_keyword in req_role_normalized:
                for related in related_keywords:
                    if related in res_role_normalized or related in resource.skills:
                        score += 5
                        break
                break
    
    # 2. SKILL MATCHING (40 points)
    required_skills = set([s.lower() for s in (requirement.skills or [])])
    resource_skills = set([s.lower() for s in (resource.skills or [])])
    
    if required_skills and resource_skills:
        matched_skills = required_skills.intersection(resource_skills)
        skill_match_ratio = len(matched_skills) / len(required_skills)
        score += skill_match_ratio * 40
        
        # Bonus for extra relevant skills
        if len(matched_skills) >= 3:
            score += 5
        
        # Check for related skills (partial matches)
        for req_skill in required_skills:
            for res_skill in resource_skills:
                if req_skill in res_skill or res_skill in req_skill:
                    score += 2
                    break
    
    # 3. EXPERIENCE MATCHING (20 points)
    if requirement.experience_min and resource.experience_years:
        exp_years = resource.experience_years
        
        if requirement.experience_max:
            if requirement.experience_min <= exp_years <= requirement.experience_max:
                score += 20
            elif exp_years >= requirement.experience_min * 0.8:
                score += 10
            elif exp_years >= requirement.experience_min * 0.6:
                score += 5
        else:
            if exp_years >= requirement.experience_min:
                score += 20
            elif exp_years >= requirement.experience_min * 0.8:
                score += 10
            elif exp_years >= requirement.experience_min * 0.6:
                score += 5
    
    # 4. AVAILABILITY BONUS (bonus points)
    if resource.availability == "Immediate":
        score += 10
    elif resource.availability_days and resource.availability_days <= 15:
        score += 5
    elif resource.availability_days and resource.availability_days <= 30:
        score += 2
    
    # Cap the score at 100
    return min(int(score), 100)