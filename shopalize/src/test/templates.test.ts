import { describe, it, expect } from 'vitest'
import { templates } from '@/data/templates'

describe('Templates', () => {
  it('has at least 10 templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(10);
  });

  it('each template has required fields', () => {
    templates.forEach(template => {
      expect(template.id).toBeTruthy();
      expect(template.name).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(template.image).toBeTruthy();
      expect(template.pages.length).toBeGreaterThan(0);
      expect(template.theme).toBeTruthy();
      expect(template.theme.primaryColor).toBeTruthy();
      expect(template.theme.fontFamily).toBeTruthy();
    });
  });

  it('each template has at least one page with sections', () => {
    templates.forEach(template => {
      const hasPageWithSections = template.pages.some(p => p.sections.length > 0);
      expect(hasPageWithSections).toBe(true);
    });
  });

  it('template IDs are unique', () => {
    const ids = templates.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has templates in different categories', () => {
    const categories = new Set(templates.map(t => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });
});
