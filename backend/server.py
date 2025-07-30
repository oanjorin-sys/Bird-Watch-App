from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status, Request
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
import logging
from enum import Enum

# Import our real API integrations
from real_api_integrations import real_api_manager, BirdIdentificationResult, EBirdSighting, XenoCantoRecording

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BirdScope Mobile API with Real Integrations", version="2.1.0")

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

# Mock database - In production, use MongoDB
USERS_DB = {}
SIGHTINGS_DB = {}
COMMUNITY_FEED_DB = {}
USER_SESSIONS = {}

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

# Enhanced bird database with real data mapping
BIRD_DATABASE_MAPPING = {
    # Maps API responses to detailed info
    'american_robin': {
        "common_name": "American Robin",
        "scientific_name": "Turdus migratorius",
        "description": "A medium-sized songbird with a distinctive red-orange breast and dark gray head and back.",
        "habitat": {
            "primary": "Gardens, parks, lawns, forests, and urban areas throughout North America",
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
            "conservation_history": "Populations declined due to DDT, recovered after ban in 1972"
        },
        "rarity": {
            "status": RarityStatus.COMMON,
            "conservation_status": "Least Concern",
            "population_trend": "Stable to increasing",
            "global_population": "320 million individuals",
            "threats": ["Climate change", "Habitat loss", "Window collisions"],
            "rarity_score": 1
        },
        "images": {
            "primary": "https://images.unsplash.com/photo-1544736150-6d0ecbaa9d7c?w=400",
            "male": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            "female": "https://images.unsplash.com/photo-1571421872008-ccbd2ba31ddb?w=400"
        }
    },
    'northern_cardinal': {
        "common_name": "Northern Cardinal",
        "scientific_name": "Cardinalis cardinalis",
        "description": "A vibrant red songbird with a prominent crest and black face mask in males.",
        "habitat": {
            "primary": "Woodlands, gardens, shrublands, and wetlands across eastern and central North America",
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
            "conservation_history": "Population increasing due to bird feeding and habitat adaptation"
        },
        "rarity": {
            "status": RarityStatus.COMMON,
            "conservation_status": "Least Concern",
            "population_trend": "Increasing",
            "global_population": "120 million individuals",
            "threats": ["Window collisions", "Domestic cats", "Habitat fragmentation"],
            "rarity_score": 2
        },
        "images": {
            "primary": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            "male": "https://images.unsplash.com/photo-1574482620881-b26db0ac2039?w=400",
            "female": "https://images.unsplash.com/photo-1597297717033-b6bb93290a7d?w=400"
        }
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

class ComprehensiveBirdResponse(BaseModel):
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
    images: Dict[str, Any]
    premium_locked: Dict[str, bool] = {}
    # Real API integration data
    api_data: Optional[Dict[str, Any]] = None
    audio_recordings: Optional[List[Dict[str, Any]]] = None
    nearby_sightings: Optional[List[Dict[str, Any]]] = None

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

def get_bird_data_by_id(bird_id: str) -> Dict[str, Any]:
    """Get comprehensive bird data by ID"""
    # Normalize bird ID
    normalized_id = bird_id.lower().replace(' ', '_').replace('-', '_')
    
    # Return data if exists, otherwise create basic structure
    if normalized_id in BIRD_DATABASE_MAPPING:
        return BIRD_DATABASE_MAPPING[normalized_id]
    
    # Create basic structure for unknown birds
    return {
        "common_name": bird_id.replace('_', ' ').title(),
        "scientific_name": f"{bird_id}_species",
        "description": f"Information about {bird_id.replace('_', ' ').title()}",
        "habitat": {"primary": "Various habitats"},
        "migration_patterns": {"summary": "Migration patterns vary"},
        "mating_season": {"period": "Spring to summer"},
        "diet": {"primary": "Varied diet"},
        "color_variants": {"description": "Color varies by age and sex"},
        "native_regions": {"original_range": "Various regions"},
        "history_culture": {"cultural_significance": "Cultural significance varies"},
        "rarity": {
            "status": RarityStatus.COMMON,
            "conservation_status": "Status unknown",
            "population_trend": "Unknown",
            "threats": ["Habitat loss", "Climate change"]
        },
        "images": {
            "primary": "https://images.unsplash.com/photo-1544736150-6d0ecbaa9d7c?w=400"
        }
    }

# API Endpoints

@app.get("/")
async def root():
    return {"message": "BirdScope Mobile API with Real Integrations", "version": "2.1.0", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "api_integrations": {
            "nyckel": "active",
            "ebird": "active", 
            "xeno_canto": "active"
        }
    }

# Authentication endpoints (same as before)
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

# Real bird identification with comprehensive API integration
@app.post("/api/identify-bird", response_model=ComprehensiveBirdResponse)
async def identify_bird_with_real_apis(
    image: UploadFile = File(...),
    location: str = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Identify a bird using real API integrations (Nyckel, eBird, Xeno-canto)"""
    
    # Check if user can scan today
    if not can_scan_today(current_user):
        raise HTTPException(status_code=429, detail="Daily scan limit reached. Upgrade to Premium for unlimited scans.")
    
    try:
        # Read the uploaded image
        image_content = await image.read()
        
        # Parse location if provided
        location_data = None
        if location:
            try:
                location_data = json.loads(location)
            except:
                location_data = {"description": location}
        
        logger.info(f"Starting real bird identification for user {current_user.id}")
        
        # Use real comprehensive API integration
        comprehensive_data = await real_api_manager.identify_bird_comprehensive(
            image_content, 
            location_data
        )
        
        # Extract identification data
        identification = comprehensive_data['identification']
        bird_id = identification['bird_id']
        
        # Get detailed bird data from our database
        bird_data = get_bird_data_by_id(bird_id)
        
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
            common_name=identification['common_name'],
            scientific_name=identification['scientific_name'],
            confidence=identification['confidence'],
            image_url=bird_data["images"]["primary"],
            location=location_data,
            timestamp=datetime.now()
        )
        
        SIGHTINGS_DB[sighting_id] = sighting.dict()
        
        logger.info(f"Successfully identified: {identification['common_name']} with {identification['confidence']:.2%} confidence")
        
        return ComprehensiveBirdResponse(
            bird_id=bird_id,
            common_name=identification['common_name'],
            scientific_name=identification['scientific_name'],
            confidence=identification['confidence'],
            description=bird_data["description"],
            habitat=bird_data["habitat"],
            migration_patterns=bird_data["migration_patterns"],
            mating_season=bird_data["mating_season"],
            diet=bird_data["diet"],
            color_variants=bird_data["color_variants"],
            native_regions=bird_data["native_regions"],
            history_culture=bird_data["history_culture"],
            rarity=bird_data["rarity"],
            images=bird_data["images"],
            premium_locked=premium_locked,
            api_data=comprehensive_data,
            audio_recordings=comprehensive_data.get('audio_recordings', []),
            nearby_sightings=comprehensive_data.get('nearby_sightings', [])
        )
        
    except Exception as e:
        logger.error(f"Bird identification error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Enhanced bird detail endpoint with real API data
@app.get("/api/bird/{bird_id}", response_model=ComprehensiveBirdResponse)
async def get_bird_detail_with_real_data(bird_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed information about a specific bird with real API integration"""
    
    try:
        # Get base bird data
        bird_data = get_bird_data_by_id(bird_id)
        
        # Get real audio recordings from Xeno-canto
        audio_recordings = await real_api_manager.search_bird_sounds(bird_data["common_name"])
        
        # Check premium features
        premium_locked = {
            "migration_maps": not check_premium_access(current_user, "migration_maps"),
            "full_audio": not check_premium_access(current_user, "full_audio"),
            "detailed_info": not check_premium_access(current_user, "detailed_info")
        }
        
        return ComprehensiveBirdResponse(
            bird_id=bird_id,
            common_name=bird_data["common_name"],
            scientific_name=bird_data["scientific_name"],
            confidence=1.0,
            description=bird_data["description"],
            habitat=bird_data["habitat"],
            migration_patterns=bird_data["migration_patterns"],
            mating_season=bird_data["mating_season"],
            diet=bird_data["diet"],
            color_variants=bird_data["color_variants"],
            native_regions=bird_data["native_regions"],
            history_culture=bird_data["history_culture"],
            rarity=bird_data["rarity"],
            images=bird_data["images"],
            premium_locked=premium_locked,
            audio_recordings=[rec.__dict__ for rec in audio_recordings]
        )
    
    except Exception as e:
        logger.error(f"Bird detail error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching bird details: {str(e)}")

# Nearby birds with real eBird integration
@app.get("/api/nearby-birds")
async def get_nearby_birds_real(
    lat: float,
    lng: float,
    radius: int = 25,
    current_user: User = Depends(get_current_user)
):
    """Get nearby bird sightings using real eBird API"""
    
    try:
        nearby_sightings = await real_api_manager.get_nearby_sightings(lat, lng, radius)
        return {"sightings": [sighting.__dict__ for sighting in nearby_sightings]}
    except Exception as e:
        logger.error(f"Nearby birds error: {str(e)}")
        return {"sightings": []}

# Audio search endpoint
@app.get("/api/bird-sounds/{species_name}")
async def search_bird_sounds(
    species_name: str,
    quality: str = 'A',
    current_user: User = Depends(get_current_user)
):
    """Search for bird sounds using real Xeno-canto API"""
    
    if not check_premium_access(current_user, "full_audio"):
        raise HTTPException(status_code=403, detail="Premium subscription required for full audio access")
    
    try:
        recordings = await real_api_manager.search_bird_sounds(species_name, quality)
        return {"recordings": [rec.__dict__ for rec in recordings]}
    except Exception as e:
        logger.error(f"Bird sounds search error: {str(e)}")
        return {"recordings": []}

# Keep all other endpoints (My Sightings, Community Feed, Subscriptions, etc.) the same as before
# ... (rest of the endpoints remain unchanged)

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
    
    bird_data = get_bird_data_by_id(bird_id)
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
                    "Unlimited bird scans with Nyckel AI",
                    "Real-time eBird data integration",
                    "Full Xeno-canto audio library access",
                    "Interactive migration maps",
                    "Unlimited sighting storage",
                    "Community posting privileges",
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
                    "Priority API access",
                    "Advanced analytics dashboard",
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
    """Subscribe to premium plan"""
    if plan_id not in ["premium_monthly", "premium_yearly"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    # Mock subscription success for development
    subscription_id = str(uuid.uuid4())
    
    # Update user subscription
    current_user.subscription_plan = SubscriptionPlan(plan_id)
    USERS_DB[current_user.id]["subscription_plan"] = plan_id
    
    return {
        "subscription_id": subscription_id,
        "plan_id": plan_id,
        "status": "active",
        "message": f"Successfully subscribed to {plan_id}",
        "api_access": {
            "nyckel": "unlimited",
            "ebird": "full_access", 
            "xeno_canto": "premium_quality"
        }
    }

# Analytics endpoints
@app.get("/api/analytics/popular-birds")
async def get_popular_birds():
    """Get most scanned birds from real usage data"""
    # Aggregate from actual sightings
    bird_counts = {}
    for sighting in SIGHTINGS_DB.values():
        bird_id = sighting["bird_id"]
        bird_counts[bird_id] = bird_counts.get(bird_id, 0) + 1
    
    popular_birds = []
    for bird_id, count in sorted(bird_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        bird_data = get_bird_data_by_id(bird_id)
        popular_birds.append({
            "bird_id": bird_id,
            "common_name": bird_data["common_name"],
            "scan_count": count
        })
    
    # Add some defaults if no data
    if not popular_birds:
        popular_birds = [
            {"bird_id": "american_robin", "common_name": "American Robin", "scan_count": 0},
            {"bird_id": "northern_cardinal", "common_name": "Northern Cardinal", "scan_count": 0},
        ]
    
    return {"popular_birds": popular_birds}

@app.get("/api/analytics/user-stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user statistics"""
    user_sightings = [s for s in SIGHTINGS_DB.values() if s["user_id"] == current_user.id]
    
    return {
        "total_scans": len(user_sightings),
        "unique_species": len(set(s["bird_id"] for s in user_sightings)),
        "scans_today": current_user.scans_today,
        "member_since": current_user.created_at.strftime("%Y-%m-%d"),
        "subscription_plan": current_user.subscription_plan.value,
        "api_usage": {
            "nyckel_calls": len(user_sightings),
            "ebird_queries": len(user_sightings),
            "xeno_canto_searches": len(user_sightings)
        }
    }

# Search endpoints
@app.get("/api/birds/search")
async def search_birds(q: str):
    """Search birds by name"""
    query = q.lower()
    results = []
    
    for bird_id, bird_data in BIRD_DATABASE_MAPPING.items():
        if (query in bird_data["common_name"].lower() or 
            query in bird_data["scientific_name"].lower()):
            results.append({
                "bird_id": bird_id,
                "common_name": bird_data["common_name"],
                "scientific_name": bird_data["scientific_name"],
                "image_url": bird_data["images"]["primary"]
            })
    
    return {"birds": results}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)