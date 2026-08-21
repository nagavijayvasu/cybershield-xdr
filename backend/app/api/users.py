from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRoleUpdate, UserStatusUpdate, UserDetailResponse
from app.security.auth import require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/users", tags=["user management"])

@router.get("/", response_model=List[UserDetailResponse])
def get_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Retrieve all registered users (Administrator only)."""
    return db.query(User).order_by(User.id).all()

@router.get("/{id}", response_model=UserDetailResponse)
def get_user_detail(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Retrieve details of a specific user by ID (Administrator only)."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.patch("/{id}/role", response_model=UserDetailResponse)
def update_user_role(
    id: int,
    role_in: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Change a user's role (Administrator only). Admins cannot change their own role."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot modify their own security role."
        )
        
    old_role = user.role
    user.role = role_in.role
    db.commit()
    db.refresh(user)
    
    # Log this administrative change to audit logs
    log_action(
        db=db,
        user_id=admin_user.id,
        username=admin_user.username,
        action="ROLE_CHANGE",
        details=f"Modified user '{user.username}' (ID: {user.id}) role from '{old_role}' to '{user.role}'."
    )
    
    return user

@router.patch("/{id}/status", response_model=UserDetailResponse)
def update_user_status(
    id: int,
    status_in: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Activate or deactivate a user account (Administrator only). Admins cannot deactivate themselves."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user.id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot toggle their own account activation status."
        )
        
    old_status = user.is_active
    user.is_active = status_in.is_active
    db.commit()
    db.refresh(user)
    
    # Log status change to audit logs
    action_str = "ACCOUNT_ACTIVATION" if user.is_active else "ACCOUNT_DEACTIVATION"
    log_action(
        db=db,
        user_id=admin_user.id,
        username=admin_user.username,
        action=action_str,
        details=f"Toggled user '{user.username}' (ID: {user.id}) active status from {old_status} to {user.is_active}."
    )
    
    return user
