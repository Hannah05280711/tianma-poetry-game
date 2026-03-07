import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getChapterSounds,
  chapter1Sounds,
  chapter2Sounds,
  chapter3Sounds,
  chapter4Sounds,
  chapter5Sounds,
  chapter6Sounds,
  chapter7Sounds,
} from './soundEffects';

describe('Sound Effects - 8-bit Chiptune for V2 Chapters', () => {
  beforeEach(() => {
    // Mock AudioContext
    const mockAudioContext = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { value: 440, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(() => ({ connect: vi.fn() })),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(() => ({ connect: vi.fn() })),
      })),
      createDelay: vi.fn(() => ({
        delayTime: { value: 0 },
        connect: vi.fn(() => ({ connect: vi.fn() })),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: { value: 1000 },
        Q: { value: 1 },
        connect: vi.fn(() => ({ connect: vi.fn() })),
      })),
      createBuffer: vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(100)),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(() => ({ connect: vi.fn() })),
        start: vi.fn(),
      })),
      resume: vi.fn(),
    };

    (window as any).AudioContext = vi.fn(() => mockAudioContext);
    (window as any).webkitAudioContext = vi.fn(() => mockAudioContext);
  });

  describe('Chapter 1: 空山禅音 (Wood Fish & Ancient Chime)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter1Sounds).toHaveProperty('correct');
      expect(chapter1Sounds).toHaveProperty('incorrect');
      expect(chapter1Sounds).toHaveProperty('levelUp');
      expect(typeof chapter1Sounds.correct).toBe('function');
      expect(typeof chapter1Sounds.incorrect).toBe('function');
      expect(typeof chapter1Sounds.levelUp).toBe('function');
    });

    it('should be able to play correct sound without error', () => {
      expect(() => chapter1Sounds.correct()).not.toThrow();
    });

    it('should be able to play incorrect sound without error', () => {
      expect(() => chapter1Sounds.incorrect()).not.toThrow();
    });

    it('should be able to play levelUp sound without error', () => {
      expect(() => chapter1Sounds.levelUp()).not.toThrow();
    });
  });

  describe('Chapter 2: 塞上风云 (Pipa & Drums)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter2Sounds).toHaveProperty('correct');
      expect(chapter2Sounds).toHaveProperty('incorrect');
      expect(chapter2Sounds).toHaveProperty('levelUp');
    });

    it('should play rapid pipa sounds for correct answer', () => {
      expect(() => chapter2Sounds.correct()).not.toThrow();
    });

    it('should play pitch drop for incorrect answer', () => {
      expect(() => chapter2Sounds.incorrect()).not.toThrow();
    });

    it('should play pipa sweep with drum for levelUp', () => {
      expect(() => chapter2Sounds.levelUp()).not.toThrow();
    });
  });

  describe('Chapter 3: 九霄惊雷 (Guzheng & Thunder)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter3Sounds).toHaveProperty('correct');
      expect(chapter3Sounds).toHaveProperty('incorrect');
      expect(chapter3Sounds).toHaveProperty('levelUp');
    });

    it('should play guzheng pluck for correct answer', () => {
      expect(() => chapter3Sounds.correct()).not.toThrow();
    });

    it('should play electronic noise for incorrect answer', () => {
      expect(() => chapter3Sounds.incorrect()).not.toThrow();
    });

    it('should play ascending guzheng with thunder for levelUp', () => {
      expect(() => chapter3Sounds.levelUp()).not.toThrow();
    });
  });

  describe('Chapter 4: 沧海幻梦 (Panpipes & Water)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter4Sounds).toHaveProperty('correct');
      expect(chapter4Sounds).toHaveProperty('incorrect');
      expect(chapter4Sounds).toHaveProperty('levelUp');
    });

    it('should play panpipe glissando for correct answer', () => {
      expect(() => chapter4Sounds.correct()).not.toThrow();
    });

    it('should play water bubble burst for incorrect answer', () => {
      expect(() => chapter4Sounds.incorrect()).not.toThrow();
    });

    it('should play panpipe melody for levelUp', () => {
      expect(() => chapter4Sounds.levelUp()).not.toThrow();
    });
  });

  describe('Chapter 5: 须弥见方 (Bells & Metal)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter5Sounds).toHaveProperty('correct');
      expect(chapter5Sounds).toHaveProperty('incorrect');
      expect(chapter5Sounds).toHaveProperty('levelUp');
    });

    it('should play bell strike for correct answer', () => {
      expect(() => chapter5Sounds.correct()).not.toThrow();
    });

    it('should play metal clash for incorrect answer', () => {
      expect(() => chapter5Sounds.incorrect()).not.toThrow();
    });

    it('should play bell ensemble for levelUp', () => {
      expect(() => chapter5Sounds.levelUp()).not.toThrow();
    });
  });

  describe('Chapter 6: 浮世清响 (Flute & Ambient)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter6Sounds).toHaveProperty('correct');
      expect(chapter6Sounds).toHaveProperty('incorrect');
      expect(chapter6Sounds).toHaveProperty('levelUp');
    });

    it('should play flute toot for correct answer', () => {
      expect(() => chapter6Sounds.correct()).not.toThrow();
    });

    it('should play paper tear for incorrect answer', () => {
      expect(() => chapter6Sounds.incorrect()).not.toThrow();
    });

    it('should play ascending flute for levelUp', () => {
      expect(() => chapter6Sounds.levelUp()).not.toThrow();
    });
  });

  describe('Chapter 7: 万重归一 (Guqin & Pure Sine)', () => {
    it('should have correct, incorrect, and levelUp sound methods', () => {
      expect(chapter7Sounds).toHaveProperty('correct');
      expect(chapter7Sounds).toHaveProperty('incorrect');
      expect(chapter7Sounds).toHaveProperty('levelUp');
    });

    it('should play guqin harmonic for correct answer', () => {
      expect(() => chapter7Sounds.correct()).not.toThrow();
    });

    it('should play muted guqin for incorrect answer', () => {
      expect(() => chapter7Sounds.incorrect()).not.toThrow();
    });

    it('should play all instruments in harmony for final levelUp', () => {
      expect(() => chapter7Sounds.levelUp()).not.toThrow();
    });
  });

  describe('getChapterSounds helper', () => {
    it('should return correct sounds for chapter 1', () => {
      const sounds = getChapterSounds(1);
      expect(sounds).toBe(chapter1Sounds);
    });

    it('should return correct sounds for chapter 2', () => {
      const sounds = getChapterSounds(2);
      expect(sounds).toBe(chapter2Sounds);
    });

    it('should return correct sounds for chapter 3', () => {
      const sounds = getChapterSounds(3);
      expect(sounds).toBe(chapter3Sounds);
    });

    it('should return correct sounds for chapter 4', () => {
      const sounds = getChapterSounds(4);
      expect(sounds).toBe(chapter4Sounds);
    });

    it('should return correct sounds for chapter 5', () => {
      const sounds = getChapterSounds(5);
      expect(sounds).toBe(chapter5Sounds);
    });

    it('should return correct sounds for chapter 6', () => {
      const sounds = getChapterSounds(6);
      expect(sounds).toBe(chapter6Sounds);
    });

    it('should return correct sounds for chapter 7', () => {
      const sounds = getChapterSounds(7);
      expect(sounds).toBe(chapter7Sounds);
    });

    it('should return chapter1 sounds for invalid chapter ID', () => {
      const sounds = getChapterSounds(0);
      expect(sounds).toBe(chapter1Sounds);
    });

    it('should return chapter1 sounds for out-of-range chapter ID', () => {
      const sounds = getChapterSounds(999);
      expect(sounds).toBe(chapter1Sounds);
    });
  });

  describe('Sound effect integration', () => {
    it('all chapters should have consistent sound method signatures', () => {
      const chapters = [
        chapter1Sounds,
        chapter2Sounds,
        chapter3Sounds,
        chapter4Sounds,
        chapter5Sounds,
        chapter6Sounds,
        chapter7Sounds,
      ];

      chapters.forEach((chapter, index) => {
        expect(chapter).toHaveProperty('correct', `Chapter ${index + 1} missing correct method`);
        expect(chapter).toHaveProperty('incorrect', `Chapter ${index + 1} missing incorrect method`);
        expect(chapter).toHaveProperty('levelUp', `Chapter ${index + 1} missing levelUp method`);
        expect(typeof chapter.correct).toBe('function', `Chapter ${index + 1} correct is not a function`);
        expect(typeof chapter.incorrect).toBe('function', `Chapter ${index + 1} incorrect is not a function`);
        expect(typeof chapter.levelUp).toBe('function', `Chapter ${index + 1} levelUp is not a function`);
      });
    });

    it('should handle multiple consecutive sound plays', () => {
      expect(() => {
        chapter1Sounds.correct();
        chapter1Sounds.correct();
        chapter2Sounds.incorrect();
        chapter3Sounds.levelUp();
      }).not.toThrow();
    });
  });
});
