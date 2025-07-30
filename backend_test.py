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

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=10)

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

    def test_identify_bird(self):
        """Test bird identification with image upload"""
        test_image = self.create_test_image()
        files = {'image': ('test_bird.jpg', test_image, 'image/jpeg')}
        success, response = self.run_test("Bird Identification", "POST", "api/identify-bird", 200, files=files)
        
        if success and response:
            # Verify response structure
            required_fields = ['bird_id', 'common_name', 'scientific_name', 'confidence', 
                             'description', 'habitat', 'migration_patterns', 'mating_season',
                             'diet', 'colors', 'native_regions', 'history', 'rarity', 
                             'audio_url', 'image_url']
            
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"⚠️  Missing fields in response: {missing_fields}")
            else:
                print(f"✅ All required fields present in identification response")
                print(f"   Identified bird: {response.get('common_name')} ({response.get('confidence', 0):.2%} confidence)")
        
        return success, response

    def test_get_bird_info(self, bird_id="american_robin"):
        """Test getting specific bird information"""
        return self.run_test(f"Get Bird Info ({bird_id})", "GET", f"api/bird/{bird_id}", 200)

    def test_get_bird_info_invalid(self):
        """Test getting invalid bird information"""
        return self.run_test("Get Invalid Bird Info", "GET", "api/bird/invalid_bird", 404)

    def test_list_birds(self):
        """Test listing all birds"""
        success, response = self.run_test("List All Birds", "GET", "api/birds", 200)
        
        if success and response:
            birds = response.get('birds', [])
            print(f"   Found {len(birds)} birds in database")
            for bird in birds[:3]:  # Show first 3 birds
                print(f"   - {bird.get('common_name')} ({bird.get('id')})")
        
        return success, response

    def test_get_pricing(self):
        """Test getting pricing information"""
        success, response = self.run_test("Get Pricing", "GET", "api/pricing", 200)
        
        if success and response:
            tiers = response.get('tiers', {})
            print(f"   Found {len(tiers)} pricing tiers")
            for tier_name, tier_data in tiers.items():
                price = tier_data.get('price', 0)
                period = tier_data.get('period', '')
                print(f"   - {tier_name}: ${price}/{period}" if price > 0 else f"   - {tier_name}: Free")
        
        return success, response

    def test_subscribe(self):
        """Test subscription endpoint"""
        # This endpoint expects form data, not JSON
        try:
            url = f"{self.base_url}/api/subscribe"
            data = {"plan": "premium", "email": "test@example.com"}
            response = requests.post(url, data=data, timeout=10)
            
            self.tests_run += 1
            print(f"\n🔍 Testing Subscribe to Plan...")
            print(f"   URL: {url}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                response_data = response.json()
                print(f"   Subscription ID: {response_data.get('subscription_id', 'N/A')}")
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            
            return success, response.json() if success else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

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