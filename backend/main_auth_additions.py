# ── Tilføj disse imports øverst i main.py ──────────────────────────────
from auth import get_current_user, create_token, hash_password, verify_password
from fastapi.security import OAuth2PasswordRequestForm
from models import User

# ── Tilføj disse routes i main.py ──────────────────────────────────────

@app.post("/api/auth/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Forkert email eller adgangskode")
    token = create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/auth/register")
def register(email: str, password: str, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email allerede i brug")
    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    db.commit()
    return {"ok": True}


@app.get("/api/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "id": current_user.id}


# ── Beskyt en route sådan her ───────────────────────────────────────────
# Tilføj `current_user: User = Depends(get_current_user)` til dine routes:
#
# @app.get("/api/buildings", response_model=list[BuildingOut])
# def get_buildings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     return db.query(Building).all()
