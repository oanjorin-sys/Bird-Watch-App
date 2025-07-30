# BirdScope AI - Cross-Platform Mobile Bird Identification App

A comprehensive React Native mobile application for identifying birds using AI, featuring detailed bird information, community sharing, and premium subscription features.

## 🚀 Features

### Core Features
- **🔍 AI-Powered Bird Identification**: Upload photos to identify bird species with confidence scores
- **📚 Comprehensive Bird Database**: Detailed information including migration patterns, mating seasons, habitat, diet, and conservation status
- **🎵 Audio Library**: Mating calls and bird sounds from Xeno-canto
- **🗺️ Interactive Migration Maps**: Visual migration routes and seasonal patterns
- **📱 Cross-Platform**: Works on both iOS and Android

### Premium Features
- **∞ Unlimited Scans**: No daily limits on bird identification
- **🎶 Full Audio Library**: Complete access to bird sound recordings
- **🗺️ Interactive Migration Maps**: Detailed migration route visualization
- **💾 Unlimited Storage**: Save all your bird sightings
- **👥 Community Features**: Share sightings and interact with other birders
- **📱 Offline Mode**: Download regional bird packs for offline use
- **🔔 Push Notifications**: Rare bird alerts in your area

### User Features
- **📖 My Sightings**: Personal log of identified birds with timestamps and locations
- **👥 Community Feed**: Share and discover bird sightings from other users
- **🎯 Premium Subscription**: Freemium model with Stripe/RevenueCat integration
- **🔐 Authentication**: Email/password and Google Sign-In support

## 🛠 Tech Stack

### Frontend (React Native)
- **React Native** with Expo framework
- **React Navigation** for navigation
- **React Native Paper** for Material Design components
- **Expo Camera** for photo capture
- **Expo Audio** for sound playback
- **Expo Location** for GPS functionality
- **React Native Vector Icons** for UI icons

### Backend (FastAPI)
- **FastAPI** for REST API
- **MongoDB** for data storage
- **Pydantic** for data validation
- **CORS middleware** for cross-origin requests

### Third-Party Integrations
- **Bird Identification**: Merlin Bird ID API (Cornell Lab) or Google Vision API
- **Bird Data**: eBird API for comprehensive bird information
- **Audio**: Xeno-canto API for bird sound recordings
- **Authentication**: Firebase Authentication
- **Payments**: RevenueCat + Stripe for subscription management
- **Maps**: Google Maps API for migration visualization
- **Push Notifications**: Firebase Cloud Messaging (FCM)

## 📁 Project Structure

```
/app/
├── backend/                    # FastAPI backend
│   ├── server.py              # Main API server
│   ├── api_integrations.py    # Third-party API integrations
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables
├── src/                       # React Native source
│   ├── screens/               # App screens
│   │   ├── SplashScreen.js
│   │   ├── LoginScreen.js
│   │   ├── CameraScreen.js
│   │   ├── ScanResultsScreen.js
│   │   ├── MySightingsScreen.js
│   │   ├── BirdDetailScreen.js
│   │   ├── PremiumUpsellScreen.js
│   │   ├── CommunityFeedScreen.js
│   │   └── SettingsScreen.js
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.js
│   │   └── BirdContext.js
│   ├── utils/                 # Utilities
│   │   └── api.js
│   └── components/ui/         # Shadcn components
├── App.js                     # Main app component
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── eas.json                   # Expo Application Services config
└── README.md
```

## 🎨 UI/UX Design

### Design System
- **Colors**: Emerald green primary (#059669), modern gradient backgrounds
- **Typography**: Inter font family with clear hierarchy
- **Components**: Material Design with React Native Paper
- **Icons**: Material Community Icons for consistency
- **Layout**: Mobile-first responsive design

### Screen Structure
1. **Splash/Login**: Branded entry with authentication options
2. **Camera**: Main identification interface with photo capture
3. **Scan Results**: Comprehensive bird information display
4. **My Sightings**: Personal bird watching log
5. **Bird Detail**: In-depth species information
6. **Premium Upsell**: Subscription upgrade interface
7. **Community Feed**: Social sharing and discovery
8. **Settings**: User preferences and account management

## 💰 Monetization Strategy

### Freemium Model
- **Free Tier**: 3 daily scans, basic information, limited features
- **Premium Monthly**: $4.99/month - Unlimited scans, full features
- **Premium Yearly**: $49.99/year - All features + 17% savings

### Premium Features Matrix
| Feature | Free | Premium |
|---------|------|---------|
| Daily Bird Scans | 3/day | Unlimited |
| Migration Maps | ❌ | ✅ Interactive + historical |
| Full Audio Library | ❌ | ✅ |
| Detailed Information | Basic | Full depth w/ sources |
| Sightings Storage | 5 entries | Unlimited + export |
| Community Posting | View only | Post + comment |
| Offline Mode | ❌ | ✅ Regional packs |
| Push Notifications | ❌ | ✅ Rare bird alerts |

## 🔧 Setup & Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- Expo CLI
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend Setup
```bash
npm install
npx expo start
```

### Environment Variables
Create `.env` files with:

**Backend (.env)**:
```
EBIRD_API_KEY=your_ebird_key
GOOGLE_VISION_API_KEY=your_google_key
FIREBASE_API_KEY=your_firebase_key
REVENUECAT_API_KEY=your_revenuecat_key
MONGO_URL=mongodb://localhost:27017/birdscope
```

**Frontend (.env)**:
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

## 📱 Building for Production

### Using Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Manual Build Process
1. **iOS**: Use Xcode with Expo build service
2. **Android**: Generate APK/AAB with Expo build service

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login

### Bird Identification
- `POST /api/identify-bird` - Identify bird from image
- `GET /api/bird/{bird_id}` - Get bird details
- `GET /api/birds/search` - Search birds by name

### User Data
- `GET /api/my-sightings` - Get user's bird sightings
- `DELETE /api/my-sightings/{id}` - Delete sighting
- `GET /api/analytics/user-stats` - User statistics

### Community
- `GET /api/community-feed` - Get community posts
- `POST /api/community-feed` - Create community post
- `POST /api/community-feed/{id}/like` - Like post

### Subscriptions
- `GET /api/subscription/plans` - Get pricing plans
- `POST /api/subscription/subscribe` - Subscribe to plan

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@birdscope.ai
- GitHub Issues: [Create an issue](https://github.com/oanjorin-sys/Bird-Watch-App/issues)

## 🙏 Acknowledgments

- **Cornell Lab of Ornithology** for eBird API and Merlin Bird ID
- **Xeno-canto** for bird sound recordings
- **Expo team** for the excellent development platform
- **React Native Paper** for Material Design components

---

**BirdScope AI** - Discover, Learn, and Share the World of Birds 🐦