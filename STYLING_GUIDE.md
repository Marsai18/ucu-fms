# UCU Fleet Management System - Styling Guide

## Color Scheme

### UCU Brand Colors
- **Primary Blue**: `#0066cc` (ucu-blue-500)
- **Gold/Accent**: `#d4af37` (ucu-gold-500)
- **Navy**: `#003366` (ucu-navy)
- **Royal Blue**: `#004080` (ucu-royal)

## Dark Mode Support

All components should support dark mode using Tailwind's `dark:` prefix.

### Common Patterns

#### Cards
```jsx
<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
```

#### Text
```jsx
<h1 className="text-gray-900 dark:text-white">Title</h1>
<p className="text-gray-600 dark:text-gray-400">Description</p>
```

#### Buttons
```jsx
<button className="bg-ucu-blue-500 hover:bg-ucu-blue-600 text-white ...">
```

#### Inputs
```jsx
<input className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white" />
```

#### Tables
```jsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <th className="text-gray-700 dark:text-gray-300">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="text-gray-800 dark:text-gray-200">Data</td>
    </tr>
  </tbody>
</table>
```

#### Status Badges
```jsx
<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">
  Status
</span>
```

## Components to Update

All pages should be updated with:
1. Dark mode support for all elements
2. UCU brand colors instead of generic purple/blue
3. Consistent styling patterns
4. Smooth transitions

## Theme Toggle

The theme toggle is available in:
- Layout sidebar (bottom)
- Header (top right)
- Login page (top right)

Theme preference is saved in localStorage and persists across sessions.

















