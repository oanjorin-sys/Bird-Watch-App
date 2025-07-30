import React, { useState, useRef } from 'react';
import './App.css';
import { Upload, Camera, Play, Pause, Volume2, Star, Check, Zap, Crown, Bird, Feather, Eye, Heart, Users, MapPin, Calendar, Leaf } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Progress } from './components/ui/progress';

const App = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [birdResult, setBirdResult] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const identifyBird = async () => {
    if (!selectedImage) return;

    setIsIdentifying(true);
    try {
      // Convert base64 to blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'bird-image.jpg');

      const apiResponse = await fetch(`${BACKEND_URL}/api/identify-bird`, {
        method: 'POST',
        body: formData,
      });

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        setBirdResult(result);
      } else {
        console.error('Failed to identify bird');
      }
    } catch (error) {
      console.error('Error identifying bird:', error);
    } finally {
      setIsIdentifying(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const pricingTiers = [
    {
      name: "Basic",
      price: "Free",
      period: "forever",
      description: "Perfect for casual bird watchers",
      features: [
        "3 bird identifications per day",
        "Basic bird information",
        "Limited audio samples",
        "5 saved sightings"
      ],
      popular: false,
      buttonText: "Start Free",
      icon: <Feather className="h-8 w-8" />,
      buttonClass: "btn-secondary"
    },
    {
      name: "Premium",
      price: "$4.99",
      period: "month",
      description: "For dedicated bird enthusiasts",
      features: [
        "Unlimited bird identification",
        "Complete bird encyclopedia",
        "Full audio library access",
        "Interactive migration maps",
        "Unlimited sighting storage",
        "Community features"
      ],
      popular: true,
      buttonText: "Start Free Trial",
      icon: <Star className="h-8 w-8" />,
      buttonClass: "btn-primary"
    },
    {
      name: "Expert",
      price: "$9.99",
      period: "month",
      description: "Professional ornithologist tools",
      features: [
        "Everything in Premium",
        "Advanced behavior analysis",
        "Historical migration data",
        "Expert consultation access",
        "Custom field guides",
        "Offline regional packs",
        "Priority support"
      ],
      popular: false,
      buttonText: "Go Expert",
      icon: <Crown className="h-8 w-8" />,
      buttonClass: "btn-accent"
    }
  ];

  const features = [
    {
      icon: <Eye className="h-8 w-8" />,
      title: "AI-Powered Identification",
      description: "Advanced machine learning identifies birds with 95% accuracy using Nyckel AI technology"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Comprehensive Information", 
      description: "Learn about habitat, diet, migration patterns, mating seasons, and conservation status"
    },
    {
      icon: <Volume2 className="h-8 w-8" />,
      title: "Authentic Bird Sounds",
      description: "Listen to mating calls and songs from the world's largest bird audio library"
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: "Migration Tracking",
      description: "Interactive maps showing seasonal movements and breeding territories"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Sharing",
      description: "Share your discoveries and connect with fellow bird watchers worldwide"
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Personal Journal",
      description: "Track your sightings, build a life list, and document your birding journey"
    }
  ];

  return (
    <div style={{ background: 'var(--gradient-natural)', minHeight: '100vh' }}>
      {/* Modern Header */}
      <header className="header-modern">
        <nav className="nav-modern">
          <a href="#" className="logo-modern">
            <div className="logo-icon">
              <Bird />
            </div>
            BirdScope AI
          </a>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="btn-secondary">Sign In</button>
            <button className="btn-primary">Get Started</button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center mb-large animate-fade-up">
            <div style={{ marginBottom: '32px' }}>
              <div className="logo-icon animate-float" style={{ width: '80px', height: '80px', margin: '0 auto', fontSize: '40px' }}>
                <Bird />
              </div>
            </div>
            <h1 className="heading-primary mb-medium">
              Discover Nature's Symphony
            </h1>
            <p className="text-natural mb-large" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Transform your bird watching experience with AI-powered identification. 
              Explore migration patterns, listen to authentic calls, and join a community of nature lovers.
            </p>
            
            {/* Modern Upload Section */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <div 
                className={`upload-modern ${dragActive ? 'upload-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleImageSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />
                
                {selectedImage ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={selectedImage} 
                      alt="Selected bird" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-medium)',
                        marginBottom: '24px'
                      }}
                    />
                    <button 
                      onClick={identifyBird}
                      disabled={isIdentifying}
                      className="btn-primary"
                      style={{ fontSize: '1.125rem', padding: '18px 36px' }}
                    >
                      {isIdentifying ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Identifying...
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Zap className="w-5 h-5" />
                          Identify This Bird
                        </div>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="animate-float" style={{ marginBottom: '24px' }}>
                      <Camera style={{ width: '64px', height: '64px', color: 'var(--sage-primary)', margin: '0 auto' }} />
                    </div>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '600', 
                      color: 'var(--forest-dark)', 
                      marginBottom: '12px',
                      fontFamily: 'Playfair Display, serif'
                    }}>
                      Upload a Bird Photo
                    </h3>
                    <p className="text-muted mb-medium">
                      Drag and drop your image here, or click to browse
                    </p>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary"
                    >
                      <Upload className="w-5 h-5" style={{ marginRight: '8px' }} />
                      Choose Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bird Result Section */}
      {birdResult && (
        <section className="section-padding" style={{ paddingTop: '60px' }}>
          <div className="container">
            <div className="card-elevated animate-fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ padding: '48px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <Badge 
                    style={{ 
                      background: 'var(--gradient-sage)', 
                      color: 'white',
                      padding: '8px 16px',
                      fontSize: '14px',
                      marginBottom: '16px'
                    }}
                  >
                    {Math.round(birdResult.confidence * 100)}% Confidence
                  </Badge>
                  <h2 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: '700', 
                    color: 'var(--forest-dark)',
                    marginBottom: '8px',
                    fontFamily: 'Playfair Display, serif'
                  }}>
                    {birdResult.common_name}
                  </h2>
                  <p style={{ 
                    fontSize: '1.25rem', 
                    color: 'var(--forest-medium)', 
                    fontStyle: 'italic' 
                  }}>
                    {birdResult.scientific_name}
                  </p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', marginBottom: '40px' }}>
                  <div>
                    <img 
                      src={birdResult.images?.primary || birdResult.image_url} 
                      alt={birdResult.common_name}
                      style={{
                        width: '100%',
                        height: '250px',
                        objectFit: 'cover',
                        borderRadius: '20px',
                        boxShadow: 'var(--shadow-medium)'
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-natural mb-medium">{birdResult.description}</p>
                    
                    {/* Audio Player */}
                    <div className="card-modern" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Volume2 style={{ color: 'var(--sage-primary)' }} />
                          <span style={{ fontWeight: '600', color: 'var(--forest-dark)' }}>Mating Call</span>
                        </div>
                        <Button
                          onClick={toggleAudio}
                          className="btn-secondary"
                          style={{ minWidth: '80px' }}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                      <audio
                        ref={audioRef}
                        src={birdResult.audio?.mating_call || birdResult.audio_url}
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </div>
                  </div>
                </div>

                {/* Detailed Information Tabs */}
                <Tabs defaultValue="habitat" style={{ width: '100%' }}>
                  <TabsList style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '32px' }}>
                    <TabsTrigger value="habitat">Habitat</TabsTrigger>
                    <TabsTrigger value="migration">Migration</TabsTrigger>
                    <TabsTrigger value="mating">Breeding</TabsTrigger>
                    <TabsTrigger value="conservation">Status</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="habitat">
                    <div className="card-modern" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: 'var(--forest-dark)' }}>
                        Habitat & Range
                      </h3>
                      <div style={{ display: 'grid', gap: '20px' }}>
                        <div>
                          <h4 style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--sage-primary)' }}>Preferred Habitat:</h4>
                          <p className="text-natural">{birdResult.habitat?.primary || birdResult.habitat}</p>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--sage-primary)' }}>Native Regions:</h4>
                          <p className="text-natural">{birdResult.native_regions?.original_range || birdResult.native_regions}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="migration">
                    <div className="card-modern" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: 'var(--forest-dark)' }}>
                        Migration Patterns
                      </h3>
                      <p className="text-natural">{birdResult.migration_patterns?.summary || birdResult.migration_patterns}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="mating">
                    <div className="card-modern" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: 'var(--forest-dark)' }}>
                        Breeding Season
                      </h3>
                      <p className="text-natural">{birdResult.mating_season?.period || birdResult.mating_season}</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="conservation">
                    <div className="card-modern" style={{ padding: '32px' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: 'var(--forest-dark)' }}>
                        Conservation Status
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <span style={{ 
                          padding: '8px 16px', 
                          background: 'var(--sage-light)', 
                          color: 'white',
                          borderRadius: '20px',
                          fontWeight: '600'
                        }}>
                          {birdResult.rarity?.conservation_status || birdResult.rarity}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className="text-muted">Population Status:</span>
                        <Progress value={85} style={{ flex: 1, maxWidth: '200px' }} />
                        <span className="text-muted">Stable</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="section-padding">
        <div className="container">
          <div className="text-center mb-large">
            <h2 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              marginBottom: '24px',
              fontFamily: 'Playfair Display, serif',
              color: 'var(--forest-dark)'
            }}>
              Why Choose BirdScope AI?
            </h2>
            <p className="text-natural" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Experience the most comprehensive bird identification platform powered by cutting-edge AI and real-time data
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon" style={{ background: index % 2 === 0 ? 'var(--gradient-sage)' : 'var(--gradient-sky)' }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-padding" style={{ background: 'var(--warm-beige)' }}>
        <div className="container">
          <div className="text-center mb-large">
            <h2 style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              marginBottom: '24px',
              fontFamily: 'Playfair Display, serif',
              color: 'var(--forest-dark)'
            }}>
              Choose Your Plan
            </h2>
            <p className="text-natural">
              Unlock the full potential of bird identification with our premium features
            </p>
          </div>

          <div className="pricing-container">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index} 
                className={`pricing-card ${tier.popular ? 'featured' : ''} animate-fade-up`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {tier.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--gradient-warm)',
                    color: 'white',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: 'var(--shadow-soft)'
                  }}>
                    Most Popular
                  </div>
                )}
                
                <div className="pricing-icon">
                  {tier.icon}
                </div>
                
                <h3 className="pricing-title">{tier.name}</h3>
                <p className="text-muted mb-medium">{tier.description}</p>
                
                <div className="pricing-price">
                  {tier.price}
                  {tier.price !== "Free" && (
                    <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--text-muted)' }}>
                      /{tier.period}
                    </span>
                  )}
                </div>
                
                <ul className="pricing-features">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex}>{feature}</li>
                  ))}
                </ul>
                
                <button className={tier.buttonClass} style={{ width: '100%', marginTop: '24px' }}>
                  {tier.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-modern">
        <div className="footer-content">
          <div className="footer-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div className="logo-icon">
                <Bird />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: '600', fontFamily: 'Playfair Display, serif' }}>
                BirdScope AI
              </span>
            </div>
            <p>Discover and learn about birds with the power of artificial intelligence and community knowledge.</p>
          </div>
          
          <div className="footer-section">
            <h3>Features</h3>
            <ul>
              <li><a href="#">Bird Identification</a></li>
              <li><a href="#">Migration Tracking</a></li>
              <li><a href="#">Audio Library</a></li>
              <li><a href="#">Community Feed</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Support</h3>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect</h3>
            <ul>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Facebook</a></li>
              <li><a href="#">YouTube</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 BirdScope AI. All rights reserved. Made with 💚 for nature lovers.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;