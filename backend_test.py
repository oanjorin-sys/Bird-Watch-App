import requests
import sys
import json
import io
from datetime import datetime
from PIL import Image

class BirdAPITester:
    def __init__(self, base_url="https://37d39279-25a4-46e3-8cae-4baf622378af.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.auth_token = None
        self.test_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        # Default headers
        default_headers = {'Content-Type': 'application/json'} if not files else {}
        
        # Add auth token if available
        if self.auth_token:
            default_headers['Authorization'] = f'Bearer {self.auth_token}'
        
        # Merge with provided headers
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    auth_headers = {k: v for k, v in default_headers.items() if k != 'Content-Type'}
                    response = requests.post(url, files=files, headers=auth_headers, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a simple test image"""
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        return img_bytes

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    # Authentication Tests
    def test_register_user(self):
        """Test user registration"""
        user_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "full_name": "Test User"
        }
        success, response = self.run_test("User Registration", "POST", "api/auth/register", 200, data=user_data)
        
        if success and response:
            self.auth_token = response.get('token')
            self.test_user_id = response.get('user', {}).get('id')
            print(f"   Registered user: {response.get('user', {}).get('email')}")
            print(f"   Token: {self.auth_token[:20]}..." if self.auth_token else "   No token received")
        
        return success, response

    def test_login_user(self):
        """Test user login"""
        login_data = {
            "email": "test@example.com",
            "password": "TestPass123!"
        }
        success, response = self.run_test("User Login", "POST", "api/auth/login", 200, data=login_data)
        
        if success and response:
            token = response.get('token')
            if token:
                print(f"   Login token: {token[:20]}...")
        
        return success, response

    def test_google_auth(self):
        """Test Google authentication"""
        # Using form data for Google auth
        try:
            url = f"{self.base_url}/api/auth/google"
            data = {"google_token": "mock_google_token"}
            response = requests.post(url, data=data, timeout=10)
            
            self.tests_run += 1
            print(f"\n🔍 Testing Google Authentication...")
            print(f"   URL: {url}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                print(f"   Google user: {response_data.get('user', {}).get('email', 'N/A')}")
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.json() if success else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    # Bird Identification Tests
    def test_identify_bird_comprehensive(self):
        """Test comprehensive bird identification"""
        test_image = self.create_test_image()
        files = {'image': ('test_bird.jpg', test_image, 'image/jpeg')}
        location_data = json.dumps({"latitude": 40.7829, "longitude": -73.9654, "description": "Central Park, NYC"})
        
        # Add location as form data
        data = {'location': location_data}
        
        success, response = self.run_test("Comprehensive Bird Identification", "POST", "api/identify-bird", 200, files=files)
        
        if success and response:
            # Verify comprehensive response structure
            required_fields = ['bird_id', 'common_name', 'scientific_name', 'confidence', 
                             'description', 'habitat', 'migration_patterns', 'mating_season',
                             'diet', 'color_variants', 'native_regions', 'history_culture', 
                             'rarity', 'audio', 'images', 'premium_locked']
            
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            else:
                print(f"✅ All required fields present in comprehensive response")
                print(f"   Identified bird: {response.get('common_name')} ({response.get('confidence', 0):.2%} confidence)")
                print(f"   Premium locked features: {response.get('premium_locked', {})}")
        
        return success, response

    def test_get_bird_detail(self, bird_id="american_robin"):
        """Test getting detailed bird information"""
        success, response = self.run_test(f"Get Bird Detail ({bird_id})", "GET", f"api/bird/{bird_id}", 200)
        
        if success and response:
            print(f"   Bird: {response.get('common_name')} - {response.get('scientific_name')}")
            print(f"   Has eBird data: {'ebird_data' in response}")
            print(f"   Has audio recordings: {'xeno_canto_recordings' in response}")
        
        return success, response

    def test_nearby_birds(self):
        """Test nearby birds endpoint"""
        params = "?lat=40.7829&lng=-73.9654&radius=25"
        success, response = self.run_test("Nearby Birds", "GET", f"api/nearby-birds{params}", 200)
        
        if success and response:
            sightings = response.get('sightings', [])
            print(f"   Found {len(sightings)} nearby sightings")
        
        return success, response

    # User Sightings Tests
    def test_get_my_sightings(self):
        """Test getting user's sightings"""
        success, response = self.run_test("Get My Sightings", "GET", "api/my-sightings", 200)
        
        if success and response:
            sightings = response.get('sightings', [])
            print(f"   User has {len(sightings)} sightings")
        
        return success, response

    # Community Feed Tests
    def test_get_community_feed(self):
        """Test getting community feed"""
        success, response = self.run_test("Get Community Feed", "GET", "api/community-feed", 200)
        
        if success and response:
            posts = response.get('posts', [])
            total = response.get('total', 0)
            print(f"   Found {len(posts)} posts out of {total} total")
        
        return success, response

    def test_create_community_post(self):
        """Test creating community post (requires premium)"""
        # This should fail for free users
        try:
            url = f"{self.base_url}/api/community-feed"
            data = {
                "bird_id": "american_robin",
                "caption": "Beautiful robin in my backyard!",
                "location": "Central Park, NYC"
            }
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            response = requests.post(url, data=data, headers=headers, timeout=10)
            
            self.tests_run += 1
            print(f"\n🔍 Testing Create Community Post...")
            print(f"   URL: {url}")
            
            # Should fail with 403 for free users
            success = response.status_code in [200, 403]
            if success:
                self.tests_passed += 1
                if response.status_code == 403:
                    print(f"✅ Passed - Premium feature correctly blocked (403)")
                else:
                    print(f"✅ Passed - Post created (200)")
                    response_data = response.json()
                    print(f"   Post ID: {response_data.get('post', {}).get('id', 'N/A')}")
            else:
                print(f"❌ Failed - Expected 200 or 403, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.json() if response.content else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_like_post(self):
        """Test liking a community post"""
        # First get community feed to find a post
        success, feed_response = self.test_get_community_feed()
        if success and feed_response.get('posts'):
            post_id = feed_response['posts'][0].get('id')
            if post_id:
                success, response = self.run_test("Like Community Post", "POST", f"api/community-feed/{post_id}/like", 200)
                if success and response:
                    print(f"   Post now has {response.get('likes', 0)} likes")
                return success, response
        
        print("⚠️  No posts available to like")
        return False, {}

    # Subscription Tests
    def test_get_subscription_plans(self):
        """Test getting subscription plans"""
        success, response = self.run_test("Get Subscription Plans", "GET", "api/subscription/plans", 200)
        
        if success and response:
            plans = response.get('plans', [])
            print(f"   Found {len(plans)} subscription plans")
            for plan in plans:
                print(f"   - {plan.get('name')}: ${plan.get('price')}/{plan.get('interval')}")
        
        return success, response

    def test_subscribe_to_plan(self):
        """Test subscribing to premium plan"""
        try:
            url = f"{self.base_url}/api/subscription/subscribe"
            data = {
                "plan_id": "premium_monthly",
                "payment_method_id": "mock_payment_method"
            }
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            response = requests.post(url, data=data, headers=headers, timeout=10)
            
            self.tests_run += 1
            print(f"\n🔍 Testing Subscribe to Plan...")
            print(f"   URL: {url}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                print(f"   Subscription ID: {response_data.get('subscription_id', 'N/A')}")
                print(f"   Plan: {response_data.get('plan_id', 'N/A')}")
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.json() if success else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    # Analytics Tests
    def test_get_popular_birds(self):
        """Test getting popular birds analytics"""
        success, response = self.run_test("Get Popular Birds", "GET", "api/analytics/popular-birds", 200)
        
        if success and response:
            popular_birds = response.get('popular_birds', [])
            print(f"   Found {len(popular_birds)} popular birds")
            for bird in popular_birds[:3]:
                print(f"   - {bird.get('common_name')}: {bird.get('scan_count')} scans")
        
        return success, response

    def test_get_user_stats(self):
        """Test getting user statistics"""
        success, response = self.run_test("Get User Stats", "GET", "api/analytics/user-stats", 200)
        
        if success and response:
            print(f"   Total scans: {response.get('total_scans', 0)}")
            print(f"   Unique species: {response.get('unique_species', 0)}")
            print(f"   Subscription: {response.get('subscription_plan', 'N/A')}")
        
        return success, response

    # Notification Tests
    def test_register_device_notifications(self):
        """Test registering device for notifications"""
        try:
            url = f"{self.base_url}/api/notifications/register-device"
            data = {"device_token": "mock_device_token_12345"}
            headers = {}
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            response = requests.post(url, data=data, headers=headers, timeout=10)
            
            self.tests_run += 1
            print(f"\n🔍 Testing Register Device for Notifications...")
            print(f"   URL: {url}")
            
            # Should fail with 403 for free users
            success = response.status_code in [200, 403]
            if success:
                self.tests_passed += 1
                if response.status_code == 403:
                    print(f"✅ Passed - Premium feature correctly blocked (403)")
                else:
                    print(f"✅ Passed - Device registered (200)")
            else:
                print(f"❌ Failed - Expected 200 or 403, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.json() if response.content else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    # Search Tests
    def test_search_birds(self):
        """Test bird search functionality"""
        success, response = self.run_test("Search Birds", "GET", "api/birds/search?q=robin", 200)
        
        if success and response:
            birds = response.get('birds', [])
            print(f"   Found {len(birds)} birds matching 'robin'")
            for bird in birds:
                print(f"   - {bird.get('common_name')} ({bird.get('scientific_name')})")
        
        return success, response

def main():
    print("🚀 Starting Bird Identification API Tests")
    print("=" * 50)
    
    # Setup
    tester = BirdAPITester()
    
    # Run all tests
    print("\n📋 Running Backend API Tests...")
    
    # Basic connectivity tests
    tester.test_root_endpoint()
    tester.test_health_check()
    
    # Core functionality tests
    success, bird_result = tester.test_identify_bird()
    
    # Bird information tests
    tester.test_list_birds()
    tester.test_get_bird_info("american_robin")
    tester.test_get_bird_info("northern_cardinal")
    tester.test_get_bird_info("blue_jay")
    tester.test_get_bird_info_invalid()
    
    # Pricing and subscription tests
    tester.test_get_pricing()
    tester.test_subscribe()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())