# Design System - Step1BasicInfo Component

Based on analysis of the Step1BasicInfo component, this document outlines the established design patterns and tokens.

## Color Tokens

### Primary Colors
- **Primary**: `#3e88ff` - Main brand color for buttons, focus states
- **Primary Hover**: `#2c6ae6` - Hover state for primary elements

### Neutral Colors
- **Background**: `#f5f5f7` - Page background (light gray)
- **Surface**: `#ffffff` - Cards, input fields, elevated elements
- **Text Primary**: `text-gray-900` - Main text content
- **Text Secondary**: `text-gray-700` - Secondary text
- **Text Muted**: `text-gray-400` - Placeholder, helper text

### State Colors
- **Error**: `red-500`, `red-400`, `red-50` - Error states and validation
- **Error Text**: `text-red-500` - Error messages

## Typography Scale

### Headings
- **Section Title**: `text-xl font-semibold` (20px, 600) - Main section headers
- **Subsection Title**: `text-lg font-semibold` (18px, 600) - Card titles, form sections

### Body Text
- **Large Body**: `text-lg` (18px) - Primary input text
- **Body**: `text-base` (16px) - Secondary input text, descriptions
- **Small**: `text-sm` (14px) - Helper text, metadata
- **Extra Small**: `text-xs` (12px) - Error messages, fine print

## Spacing System

### Consistent Spacing Tokens
- **Title to Input**: `mb-4` (16px) - **Standard spacing for all form labels**
- **Section Spacing**: `space-y-10` (40px) - Between major sections
- **Card Internal**: `p-6` (24px) - Standard card padding
- **Grid Gap Large**: `gap-16` (64px) - Between columns on large screens

### Layout Spacing
- **Page Top**: `pt-14` (56px) - Top padding for main content
- **Page Bottom**: `pb-5` (20px) - Bottom padding for main content
- **Section Bottom**: `pb-2` (8px) - Internal section bottom spacing

## Component Patterns

### Input Fields
```css
className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent 
focus:outline-none focus:bg-white focus:border-[#3e88ff] transition-all"
```
- Rounded: `rounded-xl` (12px)
- Background: `bg-gray-50` (neutral), `bg-white` (focused)
- Border: `border-2 border-transparent` (default), `border-[#3e88ff]` (focused)
- Text size varies: `text-lg` or `text-base`

### Buttons
```css
className="px-6 py-3 bg-[#3e88ff] text-white rounded-full 
hover:bg-[#2c6ae6] transition-all font-medium"
```
- Shape: `rounded-full`
- Colors: Primary background with white text
- Hover: Darker primary color
- Text: `font-medium`

### Cards
```css
className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all"
```
- Background: `bg-white`
- Shape: `rounded-xl` (12px)
- Padding: `p-6` (24px)
- Shadow: `shadow-sm` (default), `shadow-lg` (hover)

### Error States
```css
className="border-red-400 bg-red-50"  // Input field
className="text-red-500 text-xs mt-2 ml-1"  // Error message
```

## Responsive Patterns

### Grid System
- **Mobile**: Single column `grid-cols-1`
- **Large+**: Three columns `lg:grid-cols-3`

### Container Padding
- **Small**: `px-4` (16px)
- **Large**: `xl:px-8` (32px)
- **Extra Large**: `2xl:px-12` (48px)

### Max Width
- **Content Container**: `max-w-7xl` (80rem/1280px)

## Animation & Transitions
- **Standard Transition**: `transition-all` for most interactive elements
- **Hover Scale**: `hover:scale-105` for selection cards
- **Motion**: Framer Motion for page transitions and card animations

## Layout Architecture

### Full-Width Sections
```css
className="w-screen relative left-1/2 right-1/2 -mx-[50vw]"
```
Used for sections that need to break out of container constraints.

### Content Sections
1. **White Header Section**: Project info, layout/mode selection
2. **Gray Content Section**: Page composition, additional suggestions  
3. **Action Section**: Navigation buttons

This design system ensures consistency across the workflow interface while maintaining flexibility for different content types.