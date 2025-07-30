"""
API Integrations for BirdScope AI Mobile App
Handles all third-party API calls with mock data fallbacks
"""

import os
import requests
import json
import random
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import asyncio
import aiohttp
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

# API Configuration
class APIConfig:
    # eBird API
    EBIRD_API_KEY = os.getenv('EBIRD_API_KEY', 'mock_ebird_key')
    EBIRD_BASE_URL = 'https://api.ebird.org/v2'
    
    # Google APIs
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'mock_google_key')
    GOOGLE_VISION_API_KEY = os.getenv('GOOGLE_VISION_API_KEY', 'mock_vision_key')
    
    # Firebase
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'birdscope-mobile')
    FIREBASE_API_KEY = os.getenv('FIREBASE_API_KEY', 'mock_firebase_key')
    
    # RevenueCat
    REVENUECAT_API_KEY = os.getenv('REVENUECAT_API_KEY', 'mock_revenuecat_key')
    
    # Xeno-canto (no key required)
    XENO_CANTO_BASE_URL = 'https://xeno-canto.org/api/2/recordings'
    
    # Merlin Bird ID (requires special access)
    MERLIN_API_KEY = os.getenv('MERLIN_API_KEY', 'mock_merlin_key')

@dataclass
class BirdIdentificationResult:
    bird_id: str
    common_name: str
    scientific_name: str
    confidence: float
    taxonomy: Dict[str, str]
    region_codes: List[str]

@dataclass
class EBirdSighting:
    species_code: str
    common_name: str
    scientific_name: str
    location_name: str
    latitude: float
    longitude: float
    observation_date: str
    how_many: int

@dataclass
class XenoCantoRecording:
    id: str
    species: str
    subspecies: str
    country: str
    location: str
    quality: str
    file_url: str
    description: str

class MerlinBirdIDAPI:
    """Integration with Merlin Bird ID API for photo identification"""
    
    def __init__(self):
        self.api_key = APIConfig.MERLIN_API_KEY
        self.base_url = "https://api.merlinbirdid.org/v1"  # Mock URL
        
    async def identify_bird_from_image(self, image_data: bytes, location: Optional[Dict] = None) -> BirdIdentificationResult:
        """Identify bird from image using Merlin API"""
        
        if self.api_key == 'mock_merlin_key':
            return self._mock_bird_identification()
        
        try:
            # Real API implementation would go here
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # For now, return mock data
            return self._mock_bird_identification()
            
        except Exception as e:
            logger.error(f"Merlin API error: {e}")
            return self._mock_bird_identification()
    
    def _mock_bird_identification(self) -> BirdIdentificationResult:
        """Mock bird identification for testing"""
        mock_birds = [
            {
                'bird_id': 'american_robin',
                'common_name': 'American Robin',
                'scientific_name': 'Turdus migratorius',
                'confidence': random.uniform(0.85, 0.98),
                'taxonomy': {'order': 'Passeriformes', 'family': 'Turdidae'},
                'region_codes': ['US', 'CA', 'MX']
            },
            {
                'bird_id': 'northern_cardinal',
                'common_name': 'Northern Cardinal',
                'scientific_name': 'Cardinalis cardinalis',
                'confidence': random.uniform(0.80, 0.95),
                'taxonomy': {'order': 'Passeriformes', 'family': 'Cardinalidae'},
                'region_codes': ['US', 'CA', 'MX']
            },
            {
                'bird_id': 'bald_eagle',
                'common_name': 'Bald Eagle',
                'scientific_name': 'Haliaeetus leucocephalus',
                'confidence': random.uniform(0.90, 0.99),
                'taxonomy': {'order': 'Accipitriformes', 'family': 'Accipitridae'},
                'region_codes': ['US', 'CA']
            }
        ]
        
        selected_bird = random.choice(mock_birds)
        return BirdIdentificationResult(**selected_bird)

class EBirdAPI:
    """Integration with eBird API for bird data and sightings"""
    
    def __init__(self):
        self.api_key = APIConfig.EBIRD_API_KEY
        self.base_url = APIConfig.EBIRD_BASE_URL
    
    async def get_recent_observations(self, region_code: str = 'US', days: int = 7) -> List[EBirdSighting]:
        """Get recent bird observations from eBird"""
        
        if self.api_key == 'mock_ebird_key':
            return self._mock_recent_observations()
        
        try:
            headers = {'X-eBirdApiToken': self.api_key}
            url = f"{self.base_url}/data/obs/{region_code}/recent"
            params = {'back': days, 'maxResults': 50}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return [self._parse_ebird_observation(obs) for obs in data]
                    else:
                        logger.error(f"eBird API error: {response.status}")
                        return self._mock_recent_observations()
        
        except Exception as e:
            logger.error(f"eBird API error: {e}")
            return self._mock_recent_observations()
    
    async def get_species_info(self, species_code: str) -> Dict[str, Any]:
        """Get detailed species information"""
        
        if self.api_key == 'mock_ebird_key':
            return self._mock_species_info(species_code)
        
        try:
            headers = {'X-eBirdApiToken': self.api_key}
            url = f"{self.base_url}/ref/taxonomy/ebird"
            params = {'species': species_code}
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data[0] if data else {}
                    else:
                        return self._mock_species_info(species_code)
        
        except Exception as e:
            logger.error(f"eBird species info error: {e}")
            return self._mock_species_info(species_code)
    
    async def get_migration_data(self, species_code: str, region: str = 'US') -> Dict[str, Any]:
        """Get migration patterns for a species"""
        
        # Mock migration data - real implementation would aggregate historical data
        return {
            'species_code': species_code,
            'migration_pattern': 'partial_migrant',
            'peak_months': {
                'spring': ['March', 'April', 'May'],
                'fall': ['September', 'October', 'November']
            },
            'routes': ['Mississippi Flyway', 'Atlantic Flyway'],
            'distance': 'up_to_3000_miles',
            'destinations': ['Southern US', 'Central America']
        }
    
    def _parse_ebird_observation(self, obs: Dict) -> EBirdSighting:
        """Parse eBird observation data"""
        return EBirdSighting(
            species_code=obs.get('speciesCode', ''),
            common_name=obs.get('comName', ''),
            scientific_name=obs.get('sciName', ''),
            location_name=obs.get('locName', ''),
            latitude=obs.get('lat', 0.0),
            longitude=obs.get('lng', 0.0),
            observation_date=obs.get('obsDt', ''),
            how_many=obs.get('howMany', 1) or 1
        )
    
    def _mock_recent_observations(self) -> List[EBirdSighting]:
        """Mock recent observations for testing"""
        return [
            EBirdSighting(
                species_code='amerob',
                common_name='American Robin',
                scientific_name='Turdus migratorius',
                location_name='Central Park, New York',
                latitude=40.7829,
                longitude=-73.9654,
                observation_date='2025-01-30',
                how_many=3
            ),
            EBirdSighting(
                species_code='norcar',
                common_name='Northern Cardinal',
                scientific_name='Cardinalis cardinalis',
                location_name='Prospect Park, Brooklyn',
                latitude=40.6602,
                longitude=-73.9690,
                observation_date='2025-01-30',
                how_many=2
            )
        ]
    
    def _mock_species_info(self, species_code: str) -> Dict[str, Any]:
        """Mock species information"""
        return {
            'speciesCode': species_code,
            'category': 'species',
            'taxonOrder': 5000,
            'comName': 'American Robin',
            'sciName': 'Turdus migratorius',
            'order': 'Passeriformes',
            'familyCode': 'turdid1',
            'familyComName': 'Thrushes',
            'familySciName': 'Turdidae'
        }

class XenoCantoAPI:
    """Integration with Xeno-canto API for bird sounds"""
    
    def __init__(self):
        self.base_url = APIConfig.XENO_CANTO_BASE_URL
        self.rate_limit_delay = 1.0  # 1 request per second
    
    async def search_recordings(self, species_name: str, quality: str = 'A') -> List[XenoCantoRecording]:
        """Search for bird sound recordings"""
        
        try:
            params = {
                'query': f'"{species_name}" q:{quality}',
                'page': 1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        recordings = data.get('recordings', [])
                        return [self._parse_recording(rec) for rec in recordings[:5]]  # Limit to 5 recordings
                    else:
                        return self._mock_recordings(species_name)
            
            # Rate limiting
            await asyncio.sleep(self.rate_limit_delay)
        
        except Exception as e:
            logger.error(f"Xeno-canto API error: {e}")
            return self._mock_recordings(species_name)
    
    def _parse_recording(self, rec: Dict) -> XenoCantoRecording:
        """Parse Xeno-canto recording data"""
        return XenoCantoRecording(
            id=rec.get('id', ''),
            species=rec.get('sp', ''),
            subspecies=rec.get('ssp', ''),
            country=rec.get('cnt', ''),
            location=rec.get('loc', ''),
            quality=rec.get('q', ''),
            file_url=f"https:{rec.get('file', '')}",
            description=rec.get('type', '')
        )
    
    def _mock_recordings(self, species_name: str) -> List[XenoCantoRecording]:
        """Mock recordings for testing"""
        return [
            XenoCantoRecording(
                id='507852',
                species=species_name,
                subspecies='',
                country='United States',
                location='New York',
                quality='A',
                file_url='https://www.xeno-canto.org/sounds/uploaded/ZNCDXTUOFL/XC507852-Robin%20Song.mp3',
                description='song'
            )
        ]

class FirebaseAuthAPI:
    """Integration with Firebase Authentication"""
    
    def __init__(self):
        self.api_key = APIConfig.FIREBASE_API_KEY
        self.project_id = APIConfig.FIREBASE_PROJECT_ID
        self.base_url = f"https://identitytoolkit.googleapis.com/v1/accounts"
    
    async def verify_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token"""
        
        if self.api_key == 'mock_firebase_key':
            return self._mock_user_data()
        
        try:
            url = f"{self.base_url}:lookup?key={self.api_key}"
            data = {'idToken': id_token}
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        users = result.get('users', [])
                        return users[0] if users else None
                    else:
                        return None
        
        except Exception as e:
            logger.error(f"Firebase auth error: {e}")
            return None
    
    def _mock_user_data(self) -> Dict[str, Any]:
        """Mock user data for testing"""
        return {
            'localId': 'mock_user_id',
            'email': 'user@example.com',
            'displayName': 'Test User',
            'emailVerified': True
        }

class RevenueCatAPI:
    """Integration with RevenueCat for subscription management"""
    
    def __init__(self):
        self.api_key = APIConfig.REVENUECAT_API_KEY
        self.base_url = "https://api.revenuecat.com/v1"
    
    async def get_subscriber_info(self, user_id: str) -> Dict[str, Any]:
        """Get subscriber information from RevenueCat"""
        
        if self.api_key == 'mock_revenuecat_key':
            return self._mock_subscriber_info()
        
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            url = f"{self.base_url}/subscribers/{user_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return self._mock_subscriber_info()
        
        except Exception as e:
            logger.error(f"RevenueCat API error: {e}")
            return self._mock_subscriber_info()
    
    def _mock_subscriber_info(self) -> Dict[str, Any]:
        """Mock subscriber info for testing"""
        return {
            'subscriber': {
                'original_app_user_id': 'user123',
                'original_application_version': '1.0',
                'request_date': datetime.now().isoformat(),
                'subscriber_attributes': {},
                'subscriptions': {},
                'non_subscriptions': {},
                'entitlements': {
                    'premium': {
                        'expires_date': None,
                        'product_identifier': 'free_plan',
                        'purchase_date': datetime.now().isoformat()
                    }
                }
            }
        }

class GoogleMapsAPI:
    """Integration with Google Maps API for migration routes"""
    
    def __init__(self):
        self.api_key = APIConfig.GOOGLE_MAPS_API_KEY
        self.base_url = "https://maps.googleapis.com/maps/api"
    
    async def get_migration_route(self, species_code: str, season: str) -> Dict[str, Any]:
        """Get migration route visualization data"""
        
        # Mock migration route data
        return {
            'species_code': species_code,
            'season': season,
            'route_points': [
                {'lat': 45.0, 'lng': -75.0, 'name': 'Breeding Grounds'},
                {'lat': 40.0, 'lng': -80.0, 'name': 'Stopover Site'},
                {'lat': 30.0, 'lng': -85.0, 'name': 'Winter Grounds'}
            ],
            'polyline': 'mock_polyline_encoded_string',
            'distance_km': 2500,
            'duration_days': 45
        }

# API Manager class to coordinate all APIs
class APIManager:
    """Coordinate all API integrations"""
    
    def __init__(self):
        self.merlin_api = MerlinBirdIDAPI()
        self.ebird_api = EBirdAPI()
        self.xeno_canto_api = XenoCantoAPI()
        self.firebase_api = FirebaseAuthAPI()
        self.revenuecat_api = RevenueCatAPI()
        self.google_maps_api = GoogleMapsAPI()
    
    async def identify_bird_comprehensive(self, image_data: bytes, location: Optional[Dict] = None) -> Dict[str, Any]:
        """Comprehensive bird identification with all data sources"""
        
        # Step 1: Identify bird using Merlin
        identification = await self.merlin_api.identify_bird_from_image(image_data, location)
        
        # Step 2: Get detailed species info from eBird
        species_info = await self.ebird_api.get_species_info(identification.bird_id)
        
        # Step 3: Get migration data
        migration_data = await self.ebird_api.get_migration_data(identification.bird_id)
        
        # Step 4: Get audio recordings
        recordings = await self.xeno_canto_api.search_recordings(identification.common_name)
        
        # Step 5: Get migration route visualization
        migration_route = await self.google_maps_api.get_migration_route(identification.bird_id, 'spring')
        
        return {
            'identification': identification.__dict__,
            'species_info': species_info,
            'migration_data': migration_data,
            'audio_recordings': [rec.__dict__ for rec in recordings],
            'migration_route': migration_route,
            'timestamp': datetime.now().isoformat()
        }
    
    async def get_nearby_sightings(self, latitude: float, longitude: float, radius_km: int = 25) -> List[EBirdSighting]:
        """Get nearby bird sightings"""
        # For now, return recent observations for the region
        # Real implementation would use lat/lng coordinates
        return await self.ebird_api.get_recent_observations('US')
    
    async def verify_user_subscription(self, user_id: str) -> Dict[str, Any]:
        """Verify user's subscription status"""
        return await self.revenuecat_api.get_subscriber_info(user_id)

# Global API manager instance
api_manager = APIManager()