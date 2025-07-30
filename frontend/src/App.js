import React, { useState, useRef } from 'react';
import './App.css';
import { Upload, Camera, Play, Pause, Volume2, Star, Check, Zap, Crown, Bird } from 'lucide-react';
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
      features: [
        "Identify up to 5 birds per day",
        "Basic bird information",
        "Limited audio samples"
      ],
      popular: false,
      buttonText: "Get Started",
      icon: <Bird className="h-6 w-6" />
    },
    {
      name: "Premium",
      price: "$4.99",
      period: "month",
      features: [
        "Unlimited bird identification",
        "Complete bird information",
        "Full audio library",
        "Migration tracking",
        "Rare bird alerts"
      ],
      popular: true,
      buttonText: "Start Free Trial",
      icon: <Star className="h-6 w-6" />
    },
    {
      name: "Expert",
      price: "$9.99",
      period: "month",
      features: [
        "Everything in Premium",
        "Advanced behavior analysis",
        "Historical sighting data",
        "Expert consultation",
        "Custom field guides",
        "Offline mode"
      ],
      popular: false,
      buttonText: "Go Expert",
      icon: <Crown className="h-6 w-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1486365227551-f3f90034a57c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxiaXJkfGVufDB8fHx8MTc1Mzg0OTUwM3ww&ixlib=rb-4.1.0&q=85)'
          }}
        />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-3 rounded-full">
                <Bird className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-6">
              BirdScope AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              Discover the fascinating world of birds with AI-powered identification. 
              Learn about migration patterns, mating seasons, habitats, and more.
            </p>
            
            {/* Upload Section */}
            <div className="max-w-2xl mx-auto">
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                  dragActive 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-300 bg-white/70 backdrop-blur-sm'
                } hover:border-emerald-400 hover:bg-emerald-50`}
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
                  className="hidden"
                />
                
                {selectedImage ? (
                  <div className="space-y-4">
                    <img 
                      src={selectedImage} 
                      alt="Selected bird" 
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    <Button 
                      onClick={identifyBird}
                      disabled={isIdentifying}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 text-lg"
                    >
                      {isIdentifying ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                          Identifying...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Zap className="mr-2 h-5 w-5" />
                          Identify This Bird
                        </div>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-4">
                      <Camera className="mx-auto h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Upload a Bird Photo
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Drag and drop your image here, or click to browse
                    </p>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Choose Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bird Result Section */}
      {birdResult && (
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-4xl mx-auto shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-4">
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1">
                  {Math.round(birdResult.confidence * 100)}% Confidence
                </Badge>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold text-gray-800">
                {birdResult.common_name}
              </CardTitle>
              <p className="text-xl text-gray-600 italic">{birdResult.scientific_name}</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <img 
                    src={birdResult.image_url} 
                    alt={birdResult.common_name}
                    className="w-full h-64 object-cover rounded-lg shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{birdResult.description}</p>
                  
                  {/* Audio Player */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Volume2 className="h-5 w-5 text-emerald-600 mr-2" />
                        <span className="font-semibold text-gray-700">Mating Call</span>
                      </div>
                      <Button
                        onClick={toggleAudio}
                        variant="outline"
                        size="sm"
                        className="hover:bg-emerald-100"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                    <audio
                      ref={audioRef}
                      src={birdResult.audio_url}
                      onEnded={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Information Tabs */}
              <Tabs defaultValue="habitat" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                  <TabsTrigger value="habitat">Habitat</TabsTrigger>
                  <TabsTrigger value="migration">Migration</TabsTrigger>
                  <TabsTrigger value="mating">Mating</TabsTrigger>
                  <TabsTrigger value="diet">Diet</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="status">Status</TabsTrigger>
                </TabsList>
                
                <TabsContent value="habitat" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Habitat & Range</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Preferred Habitat:</h4>
                        <p className="text-gray-600">{birdResult.habitat}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Native Regions:</h4>
                        <p className="text-gray-600">{birdResult.native_regions}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="migration" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Migration Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{birdResult.migration_patterns}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="mating" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Mating Season</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{birdResult.mating_season}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="diet" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Diet & Feeding</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{birdResult.diet}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="colors" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Coloration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{birdResult.colors}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">History & Culture</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{birdResult.history}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="status" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">Conservation Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-gray-600">{birdResult.rarity}</p>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">Population Status:</span>
                          <Progress value={85} className="flex-1 max-w-xs" />
                          <span className="text-sm text-gray-500 ml-2">Stable</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of bird identification with our premium features
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                tier.popular 
                  ? 'ring-2 ring-emerald-500 bg-gradient-to-b from-emerald-50 to-white' 
                  : 'bg-white hover:shadow-xl'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              
              <CardHeader className={`text-center ${tier.popular ? 'pt-12' : 'pt-6'}`}>
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 ${
                  tier.popular 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tier.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-800">{tier.price}</span>
                  {tier.price !== "Free" && (
                    <span className="text-gray-600">/{tier.period}</span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-3 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  {tier.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Bird className="h-8 w-8 text-emerald-400 mr-2" />
                <span className="text-2xl font-bold">BirdScope AI</span>
              </div>
              <p className="text-gray-400">
                Discover and learn about birds with the power of artificial intelligence.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Bird Identification</li>
                <li>Migration Tracking</li>
                <li>Audio Library</li>
                <li>Conservation Status</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Twitter</li>
                <li>Instagram</li>
                <li>Facebook</li>
                <li>YouTube</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BirdScope AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;