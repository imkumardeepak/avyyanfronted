import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { ThemeToggle, ThemeSelector } from "./ThemeToggle";

export const ThemeDemo: React.FC = () => {
  const { theme, actualTheme } = useTheme();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Theme Demo</h2>
        <p className="text-muted-foreground">
          Current theme: <span className="font-semibold">{theme}</span>
          {theme === "system" && <span> (resolved to {actualTheme})</span>}
        </p>
      </div>

      {/* Theme Controls */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">
          Theme Controls
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">Toggle:</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-foreground">
              Selector:
            </span>
            <ThemeSelector />
          </div>
        </div>
      </div>

      {/* Color Palette Demo */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">
          Color Palette
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">
                Primary
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">Primary</p>
          </div>

          <div className="space-y-2">
            <div className="h-16 bg-secondary rounded-md flex items-center justify-center">
              <span className="text-secondary-foreground text-sm font-medium">
                Secondary
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Secondary
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-16 bg-destructive rounded-md flex items-center justify-center">
              <span className="text-destructive-foreground text-sm font-medium">
                Destructive
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Destructive
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-16 bg-muted rounded-md flex items-center justify-center">
              <span className="text-muted-foreground text-sm font-medium">
                Muted
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">Muted</p>
          </div>
        </div>
      </div>

      {/* Interactive Elements Demo */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">
          Interactive Elements
        </h3>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
              Secondary Button
            </button>
            <button className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-accent transition-colors">
              Outline Button
            </button>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Text input example"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <textarea
              placeholder="Textarea example"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Cards Demo */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition-colors">
          <h4 className="text-lg font-semibold text-card-foreground mb-2">
            Card Example
          </h4>
          <p className="text-muted-foreground">
            This is an example card that demonstrates how the theme affects
            different UI elements.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition-colors">
          <h4 className="text-lg font-semibold text-card-foreground mb-2">
            Another Card
          </h4>
          <p className="text-muted-foreground">
            Notice how all colors automatically adapt to the selected theme.
          </p>
        </div>
      </div>
    </div>
  );
};
