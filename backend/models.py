from sqlalchemy import Column, Integer, String, Float
from database import Base

from datetime import datetime
from sqlalchemy import Column, DateTime

# tilføj denne kolonne i Building modellen:


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    total_kvm = Column(Float, default=0)
    antal_lejemaal = Column(Integer, default=0)
    anskaffelse = Column(Float, default=0)
    lejeindtægter = Column(Float, default=0)
    lokaleomkostninger = Column(Float, default=0)
    fjernvarme = Column(Float, default=0)
    forsikring = Column(Float, default=0)
    ejendomsskat = Column(Float, default=0)
    renovation = Column(Float, default=0)
    vand = Column(Float, default=0)
    småting = Column(Float, default=0)
    internet = Column(Float, default=0)
    ejerforening = Column(Float, default=0)
    administration = Column(Float, default=0)
    regnskabsassistance = Column(Float, default=0)
    vicevært = Column(Float, default=0)
    udvendig_vedligeholdelse = Column(Float, default=0)
    andet = Column(Float, default=0)
    omkostninger_i_alt = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    kommentar = Column(String, default="")
