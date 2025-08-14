import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FontDemo = () => {
  const fontExamples = [
    {
      name: 'Inter (Primary)',
      className: 'font-sans',
      description: 'Clean, modern sans-serif perfect for UI and body text',
    },
    {
      name: 'Poppins (Display)',
      className: 'font-display',
      description: 'Geometric sans-serif ideal for headings and branding',
    },
    {
      name: 'Roboto',
      className: 'font-roboto',
      description: 'Google\'s flagship font, excellent for readability',
    },
    {
      name: 'Montserrat',
      className: 'font-montserrat',
      description: 'Elegant and versatile, great for modern designs',
    },
    {
      name: 'Fira Code (Mono)',
      className: 'font-mono',
      description: 'Programming font with ligatures for code blocks',
    },
  ];

  const sampleText = 'The quick brown fox jumps over the lazy dog';
  const sampleCode = 'const greeting = "Hello, World!";';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-3xl">Font Showcase</CardTitle>
          <p className="text-muted-foreground">
            Explore the beautiful typography options available in your project
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {fontExamples.map((font, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{font.name}</h3>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {font.className}
                </code>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {font.description}
              </p>
              
              <div className="space-y-2">
                <div className={`${font.className} text-2xl font-bold`}>
                  Heading Example
                </div>
                <div className={`${font.className} text-base`}>
                  {font.name.includes('Mono') ? sampleCode : sampleText}
                </div>
                <div className={`${font.className} text-sm text-muted-foreground`}>
                  Small text example for detailed content
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Font Weight Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Inter Font Weights</h4>
              <div className="font-sans font-light">Light (300)</div>
              <div className="font-sans font-normal">Regular (400)</div>
              <div className="font-sans font-medium">Medium (500)</div>
              <div className="font-sans font-semibold">Semibold (600)</div>
              <div className="font-sans font-bold">Bold (700)</div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Poppins Font Weights</h4>
              <div className="font-display font-light">Light (300)</div>
              <div className="font-display font-normal">Regular (400)</div>
              <div className="font-display font-medium">Medium (500)</div>
              <div className="font-display font-semibold">Semibold (600)</div>
              <div className="font-display font-bold">Bold (700)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">CSS Classes</h4>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div>font-sans - Inter (Primary)</div>
              <div>font-display - Poppins (Headings)</div>
              <div>font-roboto - Roboto</div>
              <div>font-montserrat - Montserrat</div>
              <div>font-mono - Fira Code</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">CSS Variables</h4>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div>var(--font-primary) - Inter</div>
              <div>var(--font-display) - Poppins</div>
              <div>var(--font-body) - Inter</div>
              <div>var(--font-heading) - Poppins</div>
              <div>var(--font-mono) - Fira Code</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FontDemo;
