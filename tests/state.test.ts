import { describe, it, expect, afterEach } from 'vitest';
import { StateManager } from '../src/state.js';
import { unlink } from 'fs/promises';
import { join } from 'path';

describe('StateManager', () => {
    const TEST_STATE_FILE = join(process.cwd(), 'test-state.json');

    afterEach(async () => {
        try {
            await unlink(TEST_STATE_FILE);
        } catch {}
    });

    it('should initialize with default state', async () => {
        const manager = new StateManager(TEST_STATE_FILE);
        await manager.load();
        expect(manager.importedCount).toBe(0);
    });

    it('should save and load state', async () => {
        const manager = new StateManager(TEST_STATE_FILE);
        await manager.load();
        manager.markImported('10.1016/j.test.1');
        await manager.save();

        const newManager = new StateManager(TEST_STATE_FILE);
        await newManager.load();
        expect(newManager.importedCount).toBe(1);
        expect(newManager.isImported('10.1016/j.test.1')).toBe(true);
    });

    it('should filter new papers', async () => {
        const manager = new StateManager(TEST_STATE_FILE);
        await manager.load();
        manager.markImported('existing-doi');

        const papers = [
            { doi: 'existing-doi', title: 'Old Paper' },
            { doi: 'new-doi', title: 'New Paper' },
        ];

        const newPapers = manager.filterNewPapers(papers);
        expect(newPapers).toHaveLength(1);
        expect(newPapers[0].doi).toBe('new-doi');
    });
});
