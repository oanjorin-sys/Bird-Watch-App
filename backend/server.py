from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import os
import json
import uuid
import base64
from datetime import datetime, timedelta
import uvicorn
import random
from enum import Enum

app = FastAPI(title="BirdScope Mobile API", version="2.0.0")

# Security
security = HTTPBearer()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enums
class SubscriptionPlan(str, Enum):
    FREE = "free"
    PREMIUM_MONTHLY = "premium_monthly"
    PREMIUM_YEARLY = "premium_yearly"

class RarityStatus(str, Enum):
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    VERY_RARE = "very_rare"
    ENDANGERED = "endangered"

# Mock database
USERS_DB = {}
SIGHTINGS_DB = {}
COMMUNITY_FEED_DB = {}
USER_SESSIONS = {}

# Enhanced bird database with comprehensive information
BIRD_DATABASE = {
    "american_robin": {
        "id": "american_robin",
        "common_name": "American Robin",
        "scientific_name": "Turdus migratorius",
        "description": "A medium-sized songbird with a distinctive red-orange breast and dark gray head and back.",
        "habitat": {
            "primary": "Gardens, parks, lawns, forests, and urban areas",
            "states": ["All US states except Hawaii", "Southern Canada", "Parts of Mexico"],
            "countries": ["United States", "Canada", "Mexico"],
            "continents": ["North America"]
        },
        "migration_patterns": {
            "summary": "Northern populations migrate south in winter, while southern populations are year-round residents.",
            "timing": "Migration occurs from September to November and March to May",
            "routes": ["Mississippi Flyway", "Atlantic Flyway", "Central Flyway"],
            "distance": "Up to 3,000 miles",
            "seasonal_behavior": "Forms large flocks during migration, travels primarily at night"
        },
        "mating_season": {
            "period": "April to July",
            "peak": "May and June",
            "behavior": "Males establish territories through song, build cup-shaped nests in trees",
            "eggs": "3-5 bright blue eggs per clutch",
            "broods": "2-3 broods per season"
        },
        "diet": {
            "primary": "Omnivorous",
            "spring_summer": "60% insects (earthworms, beetles, caterpillars), 40% fruits",
            "fall_winter": "85% fruits and berries, 15% insects",
            "favorites": ["Earthworms", "American elderberry", "Sumac berries", "Hackberry"],
            "feeding_behavior": "Ground forager, head-tilting behavior to listen for worms"
        },
        "color_variants": {
            "adult_male": "Bright red-orange breast, dark gray head and back, white throat with black streaks, yellow bill",
            "adult_female": "Similar but duller, lighter red-orange breast, brownish-gray upperparts",
            "juvenile": "Heavily spotted breast, brownish overall with pale spots on back",
            "seasonal_changes": "Brighter colors during breeding season"
        },
        "native_regions": {
            "original_range": "North America from Alaska to central Mexico",
            "introduced_areas": ["Bermuda", "Parts of Europe (limited success)"],
            "expansion": "Range expanding northward due to climate change"
        },
        "history_culture": {
            "cultural_significance": "State bird of Connecticut, Michigan, and Wisconsin",
            "folklore": "Symbol of spring's arrival, associated with renewal and new beginnings",
            "first_described": "Carl Linnaeus in 1766",
            "conservation_history": "Populations declined due to DDT, recovered after ban in 1972",
            "indigenous_names": "Various tribal names meaning 'red breast' or 'spring bird'"
        },
        "rarity": {
            "status": RarityStatus.COMMON,
            "conservation_status": "Least Concern",
            "population_trend": "Stable to increasing",
            "global_population": "320 million individuals",
            "threats": ["Climate change", "Habitat loss", "Window collisions"],
            "rarity_score": 1
        },
        "audio": {
            "mating_call": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507852-Robin%20Song.mp3",
            "alarm_call": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507853-Robin%20Alarm.mp3",
            "description": "Rich, musical warbling song; sharp 'tut-tut-tut' alarm calls"
        },
        "images": {
            "primary": "https://images.unsplash.com/photo-1544736150-6d0ecbaa9d7c?w=400",
            "male": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            "female": "https://images.unsplash.com/photo-1571421872008-ccbd2ba31ddb?w=400",
            "nest": "https://images.unsplash.com/photo-1555169062-013468b47731?w=400"
        }
    },
    "northern_cardinal": {
        "id": "northern_cardinal",
        "common_name": "Northern Cardinal",
        "scientific_name": "Cardinalis cardinalis",
        "description": "A vibrant red songbird with a prominent crest and black face mask in males.",
        "habitat": {
            "primary": "Woodlands, gardens, shrublands, and wetlands",
            "states": ["Eastern and central United States", "Expanding westward and northward"],
            "countries": ["United States", "Canada", "Mexico", "Belize", "Guatemala"],
            "continents": ["North America", "Central America"]
        },
        "migration_patterns": {
            "summary": "Non-migratory resident species that maintains territories year-round",
            "timing": "No regular migration",
            "routes": "N/A - Resident species",
            "distance": "Typically stays within 1-mile radius",
            "seasonal_behavior": "May form small flocks in winter, pairs mate for life"
        },
        "mating_season": {
            "period": "March to September",
            "peak": "April to June",
            "behavior": "Males feed females during courtship, build hidden nests in dense shrubs",
            "eggs": "2-5 grayish-white eggs with brown markings",
            "broods": "2-3 broods per season"
        },
        "diet": {
            "primary": "Granivorous (seed-eating)",
            "year_round": "90% seeds and grains, 10% insects and fruits",
            "spring_summer": "More insects for protein during breeding",
            "favorites": ["Sunflower seeds", "Safflower seeds", "Dogwood berries", "Sumac"],
            "feeding_behavior": "Strong bill for cracking seeds, ground and shrub feeder"
        },
        "color_variants": {
            "adult_male": "Brilliant red all over with black face mask, bright red crest and bill",
            "adult_female": "Brown with red tinges on wings, tail, and crest, orange-red bill",
            "juvenile": "Similar to female but with dark bill",
            "seasonal_changes": "Males may appear slightly duller in winter"
        },
        "native_regions": {
            "original_range": "Southeastern United States",
            "expansion": "Range expanded north and west significantly since 1900s",
            "current_range": "Eastern and central North America to Guatemala"
        },
        "history_culture": {
            "cultural_significance": "State bird of seven US states",
            "folklore": "Named after Catholic cardinals' red robes, symbol of devotion",
            "first_described": "Carl Linnaeus in 1758",
            "conservation_history": "Population increasing due to bird feeding and habitat adaptation",
            "sports_connection": "Mascot for St. Louis Cardinals baseball team"
        },
        "rarity": {
            "status": RarityStatus.COMMON,
            "conservation_status": "Least Concern",
            "population_trend": "Increasing",
            "global_population": "120 million individuals",
            "threats": ["Window collisions", "Domestic cats", "Habitat fragmentation"],
            "rarity_score": 2
        },
        "audio": {
            "mating_call": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507851-Cardinal%20Song.mp3",
            "alarm_call": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507849-Cardinal%20Chip.mp3",
            "description": "Clear whistled 'birdy-birdy-birdy' or 'cheer-cheer-cheer'"
        },
        "images": {
            "primary": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            "male": "https://images.unsplash.com/photo-1574482620881-b26db0ac2039?w=400",
            "female": "https://images.unsplash.com/photo-1597297717033-b6bb93290a7d?w=400",
            "pair": "https://images.unsplash.com/photo-1612024453846-9e57b8e71da1?w=400"
        }
    },
    "bald_eagle": {
        "id": "bald_eagle",
        "common_name": "Bald Eagle",
        "scientific_name": "Haliaeetus leucocephalus",
        "description": "America's national bird, a large raptor with distinctive white head and tail in adults.",
        "habitat": {
            "primary": "Near large bodies of water - lakes, rivers, coasts, marshes",
            "states": ["All US states", "Most of Canada", "Northern Mexico"],
            "countries": ["United States", "Canada", "Northern Mexico"],
            "continents": ["North America"]
        },
        "migration_patterns": {
            "summary": "Northern populations migrate south, southern populations resident",
            "timing": "October to December southbound, February to April northbound",
            "routes": ["Follow major river systems", "Coastal routes", "Great Lakes region"],
            "distance": "Up to 2,000 miles",
            "seasonal_behavior": "Congregates at ice-free waters with abundant fish"
        },
        "mating_season": {
            "period": "December to March (varies by region)",
            "peak": "February to March",
            "behavior": "Spectacular aerial courtship displays, mate for life, build massive nests",
            "eggs": "1-3 white eggs",
            "broods": "1 brood per season"
        },
        "diet": {
            "primary": "Piscivorous (fish-eating)",
            "year_round": "70% fish, 20% waterfowl, 10% small mammals and carrion",
            "fishing_technique": "Swoops down to snatch fish from water surface",
            "favorites": ["Salmon", "Trout", "Catfish", "Ducks", "Coots"],
            "feeding_behavior": "Also kleptoparasitic - steals fish from other birds"
        },
        "color_variants": {
            "adult": "White head and tail, dark brown body, yellow bill and feet",
            "juvenile": "Mottled brown all over, dark bill, takes 4-5 years to develop adult plumage",
            "immature_stages": "Gradual whitening of head and tail over several years",
            "seasonal_changes": "Bill and feet brighter yellow during breeding season"
        },
        "native_regions": {
            "original_range": "Throughout North America",
            "historical_decline": "Nearly extinct in lower 48 states by 1960s",
            "current_range": "Recovered throughout most of original range"
        },
        "history_culture": {
            "cultural_significance": "National bird of the United States since 1782",
            "folklore": "Symbol of freedom, strength, and America",
            "conservation_story": "DDT nearly caused extinction, banned pesticides led to recovery",
            "indigenous_significance": "Sacred bird in many Native American cultures",
            "legal_protection": "Protected by Bald and Golden Eagle Protection Act"
        },
        "rarity": {
            "status": RarityStatus.UNCOMMON,
            "conservation_status": "Least Concern (recovered from Endangered)",
            "population_trend": "Increasing",
            "global_population": "316,000 individuals",
            "threats": ["Lead poisoning", "Habitat loss", "Climate change"],
            "rarity_score": 6
        },
        "audio": {
            "mating_call": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507848-Eagle%20Call.mp3",
            "alarm_call": "https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507847-Eagle%20Scream.mp3",
            "description": "Surprisingly weak, high-pitched chirping for such a large bird"
        },
        "images": {
            "primary": "https://images.unsplash.com/photo-1473819378593-b56bfc446210?w=400",
            "flying": "https://images.unsplash.com/photo-1457036755803-0833454e8035?w=400",
            "juvenile": "https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400",
            "nest": "https://images.unsplash.com/photo-1589296853224-81a31c6c9cd5?w=400"
        }
    }
}

# Premium features configuration
PREMIUM_FEATURES = {
    "free": {
        "daily_scans": 3,
        "migration_maps": False,
        "full_audio": False,
        "detailed_info": False,
        "sightings_limit": 5,
        "community_post": False,
        "offline_mode": False,
        "push_notifications": False
    },
    "premium_monthly": {
        "daily_scans": -1,  # Unlimited
        "migration_maps": True,
        "full_audio": True,
        "detailed_info": True,
        "sightings_limit": -1,  # Unlimited
        "community_post": True,
        "offline_mode": True,
        "push_notifications": True
    },
    "premium_yearly": {
        "daily_scans": -1,  # Unlimited
        "migration_maps": True,
        "full_audio": True,
        "detailed_info": True,
        "sightings_limit": -1,  # Unlimited
        "community_post": True,
        "offline_mode": True,
        "push_notifications": True
    }
}

# Pydantic models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    email: str
    full_name: str
    subscription_plan: SubscriptionPlan
    created_at: datetime
    scans_today: int = 0
    last_scan_date: str = ""

class BirdSighting(BaseModel):
    id: str
    user_id: str
    bird_id: str
    common_name: str
    scientific_name: str
    confidence: float
    image_url: str
    location: Optional[Dict[str, Any]] = None
    timestamp: datetime
    notes: Optional[str] = None

class CommunityPost(BaseModel):
    id: str
    user_id: str
    user_name: str
    bird_id: str
    common_name: str
    scientific_name: str
    image_url: str
    location: Optional[Dict[str, Any]] = None
    caption: str
    timestamp: datetime
    likes: int = 0
    comments: List[Dict[str, Any]] = []

class BirdIdentificationResponse(BaseModel):
    bird_id: str
    common_name: str
    scientific_name: str
    confidence: float
    description: str
    habitat: Dict[str, Any]
    migration_patterns: Dict[str, Any]
    mating_season: Dict[str, Any]
    diet: Dict[str, Any]
    color_variants: Dict[str, Any]
    native_regions: Dict[str, Any]
    history_culture: Dict[str, Any]
    rarity: Dict[str, Any]
    audio: Dict[str, Any]
    images: Dict[str, Any]
    premium_locked: Dict[str, bool] = {}

# Helper functions
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Mock authentication - in production, verify JWT token"""
    token = credentials.credentials
    if token not in USER_SESSIONS:
        raise HTTPException(status_code=401, detail="Invalid token")
    return USER_SESSIONS[token]

def check_premium_access(user: User, feature: str) -> bool:
    """Check if user has access to premium feature"""
    user_features = PREMIUM_FEATURES.get(user.subscription_plan.value, PREMIUM_FEATURES["free"])
    return user_features.get(feature, False)

def can_scan_today(user: User) -> bool:
    """Check if user can scan more birds today"""
    daily_limit = PREMIUM_FEATURES[user.subscription_plan.value]["daily_scans"]
    if daily_limit == -1:  # Unlimited
        return True
    
    today = datetime.now().strftime("%Y-%m-%d")
    if user.last_scan_date != today:
        user.scans_today = 0
        user.last_scan_date = today
    
    return user.scans_today < daily_limit

# API Endpoints

@app.get("/")
async def root():
    return {"message": "BirdScope Mobile API", "version": "2.0.0", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Authentication endpoints
@app.post("/api/auth/register")
async def register_user(user_data: UserCreate):
    """Register a new user"""
    if user_data.email in [u["email"] for u in USERS_DB.values()]:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "subscription_plan": SubscriptionPlan.FREE,
        "created_at": datetime.now(),
        "scans_today": 0,
        "last_scan_date": ""
    }
    
    USERS_DB[user_id] = user
    
    # Create session token (mock)
    token = str(uuid.uuid4())
    USER_SESSIONS[token] = User(**user)
    
    return {"user": user, "token": token, "message": "User registered successfully"}

@app.post("/api/auth/login")
async def login_user(login_data: UserLogin):
    """Login user (mock authentication)"""
    # Mock login - find user by email
    user = None
    for u in USERS_DB.values():
        if u["email"] == login_data.email:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session token (mock)
    token = str(uuid.uuid4())
    USER_SESSIONS[token] = User(**user)
    
    return {"user": user, "token": token, "message": "Login successful"}

@app.post("/api/auth/google")
async def google_login(google_token: str = Form(...)):
    """Google authentication (mock)"""
    # Mock Google login
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": "user@gmail.com",
        "full_name": "Google User",
        "subscription_plan": SubscriptionPlan.FREE,
        "created_at": datetime.now(),
        "scans_today": 0,
        "last_scan_date": ""
    }
    
    USERS_DB[user_id] = user
    
    token = str(uuid.uuid4())
    USER_SESSIONS[token] = User(**user)
    
    return {"user": user, "token": token, "message": "Google login successful"}

# Bird identification
@app.post("/api/identify-bird", response_model=BirdIdentificationResponse)
async def identify_bird(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Identify a bird from uploaded image"""
    
    # Check if user can scan today
    if not can_scan_today(current_user):
        raise HTTPException(status_code=429, detail="Daily scan limit reached. Upgrade to Premium for unlimited scans.")
    
    try:
        # Read the uploaded image
        image_content = await image.read()
        
        # Mock identification logic - randomly select a bird
        bird_id = random.choice(list(BIRD_DATABASE.keys()))
        bird_data = BIRD_DATABASE[bird_id]
        
        # Add confidence score (mock)
        confidence = random.uniform(0.85, 0.98)
        
        # Check premium features
        premium_locked = {
            "migration_maps": not check_premium_access(current_user, "migration_maps"),
            "full_audio": not check_premium_access(current_user, "full_audio"),
            "detailed_info": not check_premium_access(current_user, "detailed_info")
        }
        
        # Update user's scan count
        current_user.scans_today += 1
        today = datetime.now().strftime("%Y-%m-%d")
        current_user.last_scan_date = today
        
        # Save sighting to user's log
        sighting_id = str(uuid.uuid4())
        sighting = BirdSighting(
            id=sighting_id,
            user_id=current_user.id,
            bird_id=bird_id,
            common_name=bird_data["common_name"],
            scientific_name=bird_data["scientific_name"],
            confidence=confidence,
            image_url=bird_data["images"]["primary"],
            timestamp=datetime.now()
        )
        
        SIGHTINGS_DB[sighting_id] = sighting.dict()
        
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
            color_variants=bird_data["color_variants"],
            native_regions=bird_data["native_regions"],
            history_culture=bird_data["history_culture"],
            rarity=bird_data["rarity"],
            audio=bird_data["audio"],
            images=bird_data["images"],
            premium_locked=premium_locked
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# My Sightings endpoints
@app.get("/api/my-sightings")
async def get_my_sightings(current_user: User = Depends(get_current_user)):
    """Get user's bird sightings"""
    user_sightings = [
        sighting for sighting in SIGHTINGS_DB.values()
        if sighting["user_id"] == current_user.id
    ]
    
    # Apply limit for free users
    if not check_premium_access(current_user, "sightings_limit"):
        user_sightings = user_sightings[:5]  # Limit to 5 for free users
    
    return {"sightings": user_sightings}

@app.delete("/api/my-sightings/{sighting_id}")
async def delete_sighting(sighting_id: str, current_user: User = Depends(get_current_user)):
    """Delete a sighting"""
    if sighting_id not in SIGHTINGS_DB:
        raise HTTPException(status_code=404, detail="Sighting not found")
    
    sighting = SIGHTINGS_DB[sighting_id]
    if sighting["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    del SIGHTINGS_DB[sighting_id]
    return {"message": "Sighting deleted successfully"}

# Community Feed endpoints
@app.get("/api/community-feed")
async def get_community_feed(limit: int = 20, offset: int = 0):
    """Get community bird sightings"""
    all_posts = list(COMMUNITY_FEED_DB.values())
    all_posts.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "posts": all_posts[offset:offset+limit],
        "total": len(all_posts)
    }

@app.post("/api/community-feed")
async def create_community_post(
    bird_id: str = Form(...),
    caption: str = Form(...),
    location: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Create a community post"""
    if not check_premium_access(current_user, "community_post"):
        raise HTTPException(status_code=403, detail="Premium subscription required to post to community feed")
    
    if bird_id not in BIRD_DATABASE:
        raise HTTPException(status_code=404, detail="Bird not found")
    
    bird_data = BIRD_DATABASE[bird_id]
    post_id = str(uuid.uuid4())
    
    post = CommunityPost(
        id=post_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        bird_id=bird_id,
        common_name=bird_data["common_name"],
        scientific_name=bird_data["scientific_name"],
        image_url=bird_data["images"]["primary"],
        caption=caption,
        timestamp=datetime.now(),
        location={"name": location} if location else None
    )
    
    COMMUNITY_FEED_DB[post_id] = post.dict()
    
    return {"post": post, "message": "Post created successfully"}

@app.post("/api/community-feed/{post_id}/like")
async def like_post(post_id: str, current_user: User = Depends(get_current_user)):
    """Like a community post"""
    if post_id not in COMMUNITY_FEED_DB:
        raise HTTPException(status_code=404, detail="Post not found")
    
    COMMUNITY_FEED_DB[post_id]["likes"] += 1
    return {"message": "Post liked", "likes": COMMUNITY_FEED_DB[post_id]["likes"]}

# Premium subscription endpoints
@app.get("/api/subscription/plans")
async def get_subscription_plans():
    """Get available subscription plans"""
    return {
        "plans": [
            {
                "id": "premium_monthly",
                "name": "Premium Monthly",
                "price": 4.99,
                "currency": "USD",
                "interval": "month",
                "features": [
                    "Unlimited bird scans",
                    "Interactive migration maps",
                    "Full mating call audio library",
                    "Detailed diet and rarity info",
                    "Unlimited sighting storage",
                    "Community posting privileges",
                    "Offline mode with region packs",
                    "Rare bird push notifications"
                ]
            },
            {
                "id": "premium_yearly",
                "name": "Premium Yearly",
                "price": 49.99,
                "currency": "USD",
                "interval": "year",
                "features": [
                    "All Premium Monthly features",
                    "Save 17% with annual billing",
                    "Priority customer support",
                    "Early access to new features"
                ]
            }
        ]
    }

@app.post("/api/subscription/subscribe")
async def subscribe_to_plan(
    plan_id: str = Form(...),
    payment_method_id: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Subscribe to premium plan (mock Stripe integration)"""
    if plan_id not in ["premium_monthly", "premium_yearly"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Mock Stripe payment processing
    subscription_id = str(uuid.uuid4())
    
    # Update user subscription
    current_user.subscription_plan = SubscriptionPlan(plan_id)
    USERS_DB[current_user.id]["subscription_plan"] = plan_id
    
    return {
        "subscription_id": subscription_id,
        "plan_id": plan_id,
        "status": "active",
        "message": f"Successfully subscribed to {plan_id}"
    }

# Analytics endpoints
@app.get("/api/analytics/popular-birds")
async def get_popular_birds():
    """Get most scanned birds"""
    # Mock analytics data
    return {
        "popular_birds": [
            {"bird_id": "american_robin", "common_name": "American Robin", "scan_count": 1245},
            {"bird_id": "northern_cardinal", "common_name": "Northern Cardinal", "scan_count": 892},
            {"bird_id": "bald_eagle", "common_name": "Bald Eagle", "scan_count": 567}
        ]
    }

@app.get("/api/analytics/user-stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user statistics"""
    user_sightings = [s for s in SIGHTINGS_DB.values() if s["user_id"] == current_user.id]
    
    return {
        "total_scans": len(user_sightings),
        "unique_species": len(set(s["bird_id"] for s in user_sightings)),
        "scans_today": current_user.scans_today,
        "member_since": current_user.created_at.strftime("%Y-%m-%d"),
        "subscription_plan": current_user.subscription_plan.value
    }

# Push notification endpoints
@app.post("/api/notifications/register-device")
async def register_device_for_notifications(
    device_token: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Register device for push notifications"""
    if not check_premium_access(current_user, "push_notifications"):
        raise HTTPException(status_code=403, detail="Premium subscription required for notifications")
    
    # Mock device registration
    return {"message": "Device registered for notifications", "device_token": device_token}

@app.post("/api/notifications/rare-bird-alert")
async def send_rare_bird_alert(
    bird_id: str = Form(...),
    location: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Send rare bird alert to nearby users (admin only)"""
    # Mock rare bird alert
    return {"message": f"Rare bird alert sent for {bird_id} at {location}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)