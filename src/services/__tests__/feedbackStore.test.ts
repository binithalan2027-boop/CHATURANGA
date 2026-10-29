import { describe, it, expect, beforeEach } from 'vitest';
import {
  submitFeedback,
  getFeedbackList,
  clearFeedbackList,
  exportFeedbackJson,
} from '../feedbackStore';

describe('feedbackStore', () => {
  beforeEach(() => {
    clearFeedbackList();
  });

  it('submits feedback and stores it in localStorage', () => {
    const submission = submitFeedback({
      category: 'modes',
      rating: 'great',
      newModesWanted: 'Duck Chess and Horde',
      whatIsWorking: 'Piece glide animations are smooth',
      whatIsNotWorking: 'Nothing so far',
      selectedTags: ['Duck Chess', 'Piece Glide Animations'],
      contactName: 'Player1',
      contactEmail: 'p1@test.com',
      playerId: 'AB12CD34',
    });

    expect(submission.id).toMatch(/^fb_/);
    expect(submission.createdAt).toBeDefined();

    const list = getFeedbackList();
    expect(list).toHaveLength(1);
    expect(list[0].newModesWanted).toBe('Duck Chess and Horde');
    expect(list[0].selectedTags).toContain('Duck Chess');
  });

  it('handles multiple submissions in reverse chronological order', () => {
    submitFeedback({
      category: 'working',
      rating: 'good',
      newModesWanted: '',
      whatIsWorking: 'Fast loading',
      whatIsNotWorking: '',
      selectedTags: ['Clean Dark Design'],
    });

    submitFeedback({
      category: 'not_working',
      rating: 'needs_work',
      newModesWanted: '',
      whatIsWorking: '',
      whatIsNotWorking: 'Mobile layout overflow',
      selectedTags: ['Mobile Screen Layout'],
    });

    const list = getFeedbackList();
    expect(list).toHaveLength(2);
    expect(list[0].whatIsNotWorking).toBe('Mobile layout overflow');
    expect(list[1].whatIsWorking).toBe('Fast loading');
  });

  it('exports valid JSON string', () => {
    submitFeedback({
      category: 'all',
      rating: 'great',
      newModesWanted: '4-Player Chess',
      whatIsWorking: 'All good',
      whatIsNotWorking: 'None',
      selectedTags: [],
    });

    const json = exportFeedbackJson();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].newModesWanted).toBe('4-Player Chess');
  });
});
