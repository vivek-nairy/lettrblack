import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus, BookOpen, Users, Gamepad2, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function SignInModal() {
  const navigate = useNavigate();
  const { showSignInModal, setShowSignInModal } = useAuth();

  if (!showSignInModal) return null;

  const handleSignIn = () => {
    setShowSignInModal(false);
    navigate('/signin');
  };

  const handleSignUp = () => {
    setShowSignInModal(false);
    navigate('/signup');
  };

  const handleClose = () => {
    setShowSignInModal(false);
  };

  const features = [
    {
      icon: Users,
      title: 'Join Study Groups',
      description: 'Connect with other learners and collaborate on projects',
      color: 'text-blue-500'
    },
    {
      icon: MessageSquare,
      title: 'Chat & Collaborate',
      description: 'Share ideas and get help from your study community',
      color: 'text-green-500'
    },
    {
      icon: Gamepad2,
      title: 'Play LettrPlay Games',
      description: 'Learn through fun educational games and earn XP',
      color: 'text-purple-500'
    },
    {
      icon: Zap,
      title: 'Access LetterAI',
      description: 'Get personalized learning assistance and study tips',
      color: 'text-orange-500'
    },
    {
      icon: BookOpen,
      title: 'Save Progress',
      description: 'Track your learning journey and achievements',
      color: 'text-indigo-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sign In to Continue</h2>
            <p className="text-muted-foreground mt-1">
              Create an account or sign in to access all features
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-muted hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Ready to start learning?</h3>
              <p className="text-muted-foreground text-sm">
                Join thousands of students already learning on LettrBlack
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={handleSignIn}
                className="flex-1 sm:flex-none"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button 
                onClick={handleSignUp}
                variant="outline"
                className="flex-1 sm:flex-none"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
