# Accessibility Audit Report - Parliament Explorer

**Date:** October 19, 2025  
**Application:** Oireachtas Parliament Explorer  
**Audit Type:** Code Review & Manual Testing  
**WCAG Version:** 2.1 AA

## Executive Summary

This accessibility audit identifies areas for improvement in the Parliament Explorer application to ensure compliance with WCAG 2.1 AA standards and improve usability for users with disabilities.

## Critical Issues Found

### 1. Missing ARIA Labels and Descriptions
**Severity:** High  
**WCAG Guidelines:** 1.3.1, 4.1.2

**Issues:**
- Buttons lack `aria-label` attributes for screen reader context
- Close buttons (×) have no accessible text
- Form controls lack proper labeling
- Icon-only buttons need better descriptions

**Examples:**
```tsx
// Current - Problematic
<button onClick={onClose}>
  <X className="w-6 h-6" />
</button>

// Should be
<button onClick={onClose} aria-label="Close modal">
  <X className="w-6 h-6" />
</button>
```

### 2. Keyboard Navigation Issues
**Severity:** High  
**WCAG Guidelines:** 2.1.1, 2.1.2

**Issues:**
- Modal focus management missing
- No focus trap in modals
- Missing keyboard handlers for custom components
- Tab order not optimized

**Examples:**
```tsx
// Missing keyboard handlers
<div onClick={() => setSelectedFeature(feature.id)}>
  {feature.name}
</div>

// Should support keyboard
<div 
  onClick={() => setSelectedFeature(feature.id)}
  onKeyDown={(e) => e.key === 'Enter' && setSelectedFeature(feature.id)}
  tabIndex={0}
  role="button"
>
  {feature.name}
</div>
```

### 3. Color Contrast and Visual Issues
**Severity:** Medium  
**WCAG Guidelines:** 1.4.3, 1.4.11

**Issues:**
- Gray text may not meet minimum contrast ratio (4.5:1)
- Status indicators rely solely on color
- Loading states need better visual feedback

### 4. Form Accessibility
**Severity:** High  
**WCAG Guidelines:** 1.3.1, 3.3.2

**Issues:**
- Missing form labels for screen readers
- Error states not properly announced
- Required fields not clearly marked
- Input placeholders used as labels

**Examples:**
```tsx
// Current - Problematic
<input
  placeholder="Ask about Irish Parliament..."
  className="..."
/>

// Should be
<label htmlFor="query-input" className="sr-only">
  Ask question about Irish Parliament
</label>
<input
  id="query-input"
  placeholder="Ask about Irish Parliament..."
  aria-describedby="query-help"
  className="..."
/>
```

### 5. Modal and Dialog Issues
**Severity:** High  
**WCAG Guidelines:** 2.1.2, 4.1.3

**Issues:**
- No focus management when opening/closing modals
- Missing `role="dialog"` and `aria-modal="true"`
- No escape key handling
- Background not properly hidden from screen readers

### 6. Image Accessibility
**Severity:** Medium  
**WCAG Guidelines:** 1.1.1

**Issues:**
- Some images have generic alt text
- Loading states for images not accessible
- Decorative images not marked as such

## Moderate Issues

### 7. Heading Structure
**Severity:** Medium  
**WCAG Guidelines:** 1.3.1

- Heading levels may skip (h1 to h3)
- Page structure not clearly defined
- Some headings used for styling rather than structure

### 8. Language Support
**Severity:** Medium  
**WCAG Guidelines:** 3.1.1, 3.1.2

- Mixed language content needs `lang` attributes
- Irish content should be marked with `lang="ga"`
- Page language may not be properly declared

### 9. Error Handling
**Severity:** Medium  
**WCAG Guidelines:** 3.3.1, 3.3.3

- Error messages not properly associated with form fields
- Loading states not announced to screen readers
- Form validation feedback insufficient

## Minor Issues

### 10. Skip Links
**Severity:** Low  
**WCAG Guidelines:** 2.4.1

- No skip navigation links for keyboard users
- No skip to main content option

### 11. Page Titles
**Severity:** Low  
**WCAG Guidelines:** 2.4.2

- Dynamic page titles needed for SPA navigation
- Context changes not reflected in title

## Recommendations

### Immediate Actions (High Priority)

1. **Add ARIA Labels**
   ```tsx
   // All buttons need descriptive labels
   <button aria-label="Copy response to clipboard">
     <Copy size={14} />
     Copy
   </button>
   ```

2. **Implement Focus Management**
   ```tsx
   // Modal focus trap
   useEffect(() => {
     if (isOpen) {
       const focusableElements = modal.querySelectorAll(
         'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
       );
       focusableElements[0]?.focus();
     }
   }, [isOpen]);
   ```

3. **Fix Form Labels**
   ```tsx
   <label htmlFor="feedback-text" className="block text-sm font-medium">
     What could we improve? <span className="text-red-500">*</span>
   </label>
   <textarea
     id="feedback-text"
     aria-required="true"
     aria-describedby="feedback-help"
   />
   ```

4. **Add Keyboard Support**
   ```tsx
   <div
     role="button"
     tabIndex={0}
     onClick={handleClick}
     onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
         e.preventDefault();
         handleClick();
       }
     }}
   >
   ```

### Medium Priority Actions

1. **Improve Modal Structure**
   ```tsx
   <div
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title"
     aria-describedby="modal-description"
   >
   ```

2. **Add Language Attributes**
   ```tsx
   <span lang="ga">Córas AI le rochtain ar dhíospóireachtaí</span>
   ```

3. **Enhance Error States**
   ```tsx
   <input
     aria-invalid={hasError}
     aria-describedby={hasError ? "error-message" : undefined}
   />
   {hasError && <div id="error-message" role="alert">{error}</div>}
   ```

### Low Priority Actions

1. Add skip navigation links
2. Implement dynamic page titles
3. Add loading announcements
4. Improve heading structure

## Testing Recommendations

1. **Automated Testing**: Install and configure axe-core for continuous accessibility testing
2. **Screen Reader Testing**: Test with NVDA, JAWS, or built-in screen readers
3. **Keyboard Testing**: Navigate entire application using only keyboard
4. **Color Contrast**: Use tools like WebAIM's contrast checker
5. **Mobile Accessibility**: Test with mobile screen readers

## Implementation Priority

### Phase 1 (Immediate - 1-2 weeks)
- Add aria-labels to all buttons and interactive elements
- Implement basic keyboard navigation
- Fix form labeling issues
- Add focus management to modals

### Phase 2 (Medium - 2-4 weeks)
- Improve modal accessibility
- Add proper error handling
- Implement skip links
- Fix heading structure

### Phase 3 (Long-term - 1-2 months)
- Complete language support
- Advanced keyboard navigation
- Comprehensive testing suite
- User testing with disabled users

## Tools for Ongoing Testing

1. **axe-DevTools** browser extension
2. **WAVE** web accessibility evaluation tool
3. **Lighthouse** accessibility audit
4. **axe-core** for automated testing
5. **Screen readers** for manual testing

## Compliance Status

- **Current**: Partially compliant with WCAG 2.1 A
- **Target**: Full compliance with WCAG 2.1 AA
- **Estimated completion**: 4-6 weeks with dedicated effort

This audit provides a roadmap for making the Parliament Explorer fully accessible to users with disabilities while maintaining its functionality and user experience.