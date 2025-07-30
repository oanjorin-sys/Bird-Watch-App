from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import uuid
import base64
from datetime import datetime
import uvicorn

app = FastAPI(title="Bird Identification API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock bird database with comprehensive information
BIRD_DATABASE = {
    "american_robin": {
        "id": "american_robin",
        "common_name": "American Robin",
        "scientific_name": "Turdus migratorius",
        "description": "A medium-sized songbird with a distinctive red-orange breast and dark gray head and back.",
        "habitat": "Gardens, parks, lawns, forests, and urban areas throughout North America",
        "migration_patterns": "Northern populations migrate south in winter, while southern populations are year-round residents. Migration occurs from September to November and March to May.",
        "mating_season": "April to July, with peak breeding in May and June",
        "diet": "Earthworms, insects, fruits, and berries. Diet changes seasonally - more protein during spring/summer for nesting.",
        "colors": "Males: bright red-orange breast, dark gray head and back, white throat with black streaks. Females: similar but duller colors.",
        "native_regions": "North America - from Alaska and Canada to central Mexico, introduced to parts of Europe",
        "history": "State bird of Connecticut, Michigan, and Wisconsin. First described by Carl Linnaeus in 1766. Symbol of spring's arrival in northern climates.",
        "rarity": "Common - Least Concern conservation status",
        "audio_url": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507852-Robin%20Song.mp3",
        "image_url": "https://images.unsplash.com/photo-1544736150-6d0ecbaa9d7c?w=400"
    },
    "northern_cardinal": {
        "id": "northern_cardinal",
        "common_name": "Northern Cardinal",
        "scientific_name": "Cardinalis cardinalis",
        "description": "A vibrant red songbird with a prominent crest and black face mask in males.",
        "habitat": "Woodlands, gardens, shrublands, and wetlands across eastern and central North America",
        "migration_patterns": "Non-migratory resident species that maintains territories year-round",
        "mating_season": "March to September, with multiple broods possible per season",
        "diet": "Seeds, grains, fruits, and insects. Prefers sunflower seeds and safflower seeds at feeders.",
        "colors": "Males: brilliant red with black face mask. Females: brown with red tinges on wings, tail, and crest.",
        "native_regions": "Eastern and central North America, from southeastern Canada to Guatemala",
        "history": "State bird of seven US states. Named by early settlers after Catholic cardinals' red robes. Range expanding northward due to climate change.",
        "rarity": "Common - Least Concern conservation status",
        "audio_url": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507851-Cardinal%20Song.mp3",
        "image_url": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"
    },
    "blue_jay": {
        "id": "blue_jay",
        "common_name": "Blue Jay",
        "scientific_name": "Cyanocitta cristata",
        "description": "An intelligent corvid with brilliant blue coloring, white underparts, and a prominent crest.",
        "habitat": "Oak and pine forests, suburban areas, parks, and woodlands across eastern North America",
        "migration_patterns": "Partial migrant - some populations migrate south in winter while others remain year-round",
        "mating_season": "April to July, typically raising one brood per year",
        "diet": "Omnivorous - acorns, nuts, seeds, insects, eggs, and nestlings. Known for caching food for winter.",
        "colors": "Bright blue upperparts, white or light gray underparts, black necklace across throat, white patches on wings and tail",
        "native_regions": "Eastern and central North America, from southern Canada to the Gulf of Mexico",
        "history": "Known for intelligence and complex social behavior. Important seed disperser for oak trees. Featured in indigenous folklore.",
        "rarity": "Common - Least Concern conservation status",
        "audio_url": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507850-BlueJay%20Call.mp3",
        "image_url": "https://images.unsplash.com/photo-1571421872008-ccbd2ba31ddb?w=400"
    }
}

# Pricing tiers
PRICING_TIERS = {
    "basic": {
        "name": "Basic",
        "price": 0,
        "currency": "USD",
        "period": "forever",
        "features": [
            "Identify up to 5 birds per day",
            "Basic bird information",
            "Limited audio samples"
        ]
    },
    "premium": {
        "name": "Premium",
        "price": 4.99,
        "currency": "USD",
        "period": "month",
        "features": [
            "Unlimited bird identification",
            "Complete bird information",
            "Full audio library",
            "Migration tracking",
            "Rare bird alerts"
        ]
    },
    "expert": {
        "name": "Expert",
        "price": 9.99,
        "currency": "USD",
        "period": "month",
        "features": [
            "Everything in Premium",
            "Advanced behavior analysis",
            "Historical sighting data",
            "Expert consultation",
            "Custom field guides",
            "Offline mode"
        ]
    }
}

class BirdIdentificationResponse(BaseModel):
    bird_id: str
    common_name: str
    scientific_name: str
    confidence: float
    description: str
    habitat: str
    migration_patterns: str
    mating_season: str
    diet: str
    colors: str
    native_regions: str
    history: str
    rarity: str
    audio_url: str
    image_url: str

class PricingResponse(BaseModel):
    tiers: dict

@app.get("/")
async def root():
    return {"message": "Bird Identification API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/identify-bird", response_model=BirdIdentificationResponse)
async def identify_bird(image: UploadFile = File(...)):
    """
    Identify a bird from an uploaded image
    Currently uses mock data - will integrate with Google Vision API
    """
    try:
        # Read the uploaded image
        image_content = await image.read()
        
        # Mock identification logic - randomly select a bird for demo
        # In production, this would use Google Vision API
        import random
        bird_id = random.choice(list(BIRD_DATABASE.keys()))
        bird_data = BIRD_DATABASE[bird_id]
        
        # Add confidence score (mock)
        confidence = random.uniform(0.85, 0.98)
        
        return BirdIdentificationResponse(
            bird_id=bird_data["id"],
            common_name=bird_data["common_name"],
            scientific_name=bird_data["scientific_name"],
            confidence=confidence,
            description=bird_data["description"],
            habitat=bird_data["habitat"],
            migration_patterns=bird_data["migration_patterns"],
            mating_season=bird_data["mating_season"],
            diet=bird_data["diet"],
            colors=bird_data["colors"],
            native_regions=bird_data["native_regions"],
            history=bird_data["history"],
            rarity=bird_data["rarity"],
            audio_url=bird_data["audio_url"],
            image_url=bird_data["image_url"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/api/bird/{bird_id}", response_model=BirdIdentificationResponse)
async def get_bird_info(bird_id: str):
    """Get detailed information about a specific bird"""
    if bird_id not in BIRD_DATABASE:
        raise HTTPException(status_code=404, detail="Bird not found")
    
    bird_data = BIRD_DATABASE[bird_id]
    return BirdIdentificationResponse(
        bird_id=bird_data["id"],
        common_name=bird_data["common_name"],
        scientific_name=bird_data["scientific_name"],
        confidence=1.0,
        description=bird_data["description"],
        habitat=bird_data["habitat"],
        migration_patterns=bird_data["migration_patterns"],
        mating_season=bird_data["mating_season"],
        diet=bird_data["diet"],
        colors=bird_data["colors"],
        native_regions=bird_data["native_regions"],
        history=bird_data["history"],
        rarity=bird_data["rarity"],
        audio_url=bird_data["audio_url"],
        image_url=bird_data["image_url"]
    )

@app.get("/api/birds")
async def list_birds():
    """Get list of all birds in database"""
    return {
        "birds": [
            {
                "id": bird_id,
                "common_name": bird_data["common_name"],
                "scientific_name": bird_data["scientific_name"],
                "image_url": bird_data["image_url"]
            }
            for bird_id, bird_data in BIRD_DATABASE.items()
        ]
    }

@app.get("/api/pricing", response_model=PricingResponse)
async def get_pricing():
    """Get pricing tiers"""
    return PricingResponse(tiers=PRICING_TIERS)

@app.post("/api/subscribe")
async def subscribe_to_plan(plan: str = Form(...), email: str = Form(...)):
    """Subscribe to a pricing plan (mock endpoint)"""
    if plan not in PRICING_TIERS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Mock subscription logic
    subscription_id = str(uuid.uuid4())
    
    return {
        "subscription_id": subscription_id,
        "plan": plan,
        "email": email,
        "status": "active",
        "message": f"Successfully subscribed to {PRICING_TIERS[plan]['name']} plan"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)