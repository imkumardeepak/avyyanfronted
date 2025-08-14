import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GrokLoginWrapper } from '@/components/GrokAnimations';

const AnimationDemo = () => {
  return (
    <GrokLoginWrapper>
      <div className="w-full max-w-md space-y-6">
        <Card className="login-card animate-fade-in-up">
          <CardHeader className="text-center space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-20 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full logo-glow animate-grok-float flex items-center justify-center">
                <span className="text-white font-bold text-2xl">G</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground animate-grok-pulse">
                  Grok Animation Demo
                </h1>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Experience the floating star animation similar to Grok's style
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Animation Features:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✨ Floating stars from top to bottom</li>
                <li>🌟 Multiple particle types (circles, diamonds, stars)</li>
                <li>🎨 Gradient colors (blue, purple, pink)</li>
                <li>💫 Pulsing and floating effects</li>
                <li>🌈 Glassmorphism login card</li>
                <li>🎭 Animated background gradients</li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">How to use:</h4>
              <p className="text-sm text-muted-foreground">
                Simply wrap your login form with <code className="bg-muted px-1 rounded">GrokLoginWrapper</code> 
                and add the <code className="bg-muted px-1 rounded">login-card</code> class to your card component.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </GrokLoginWrapper>
  );
};

export default AnimationDemo;
