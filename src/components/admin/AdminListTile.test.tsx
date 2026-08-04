import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import AdminListTile from './AdminListTile';

describe('AdminListTile', () => {
    const defaultProps = {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
        domain: 'Test Domain',
        status: 'Published',
        isSelected: false,
        onTap: vi.fn(),
        onAction: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('triggers onTap when the tile button is clicked', () => {
        render(<AdminListTile {...defaultProps} />);
        // The main button that wraps the content
        const tileButton = screen.getByText(/test title/i).closest('button');
        if (!tileButton) throw new Error('Tile button not found');
        fireEvent.click(tileButton);
        expect(defaultProps.onTap).toHaveBeenCalledTimes(1);
    });

    it('triggers onTap when the subtitle (inside the button) is clicked', () => {
        render(<AdminListTile {...defaultProps} />);
        const subtitle = screen.getByText(/test subtitle/i);
        fireEvent.click(subtitle);
        expect(defaultProps.onTap).toHaveBeenCalledTimes(1);
    });

    it('does NOT trigger onTap when the more actions button is clicked', () => {
        render(<AdminListTile {...defaultProps} />);
        // The MoreVertical button is outside the main onTap button
        const moreButton = screen.getByRole('button', { name: /actions for test title/i });
        fireEvent.click(moreButton);
        expect(defaultProps.onTap).not.toHaveBeenCalled();
    });

    it('triggers onAction when an action menu item is clicked', async () => {
        render(<AdminListTile {...defaultProps} />);
        
        fireEvent.pointerDown(screen.getByRole('button', { name: /actions for test title/i }));
        const editButton = await screen.findByText('Edit');
        fireEvent.click(editButton);
        
        expect(defaultProps.onAction).toHaveBeenCalledWith('edit');
        expect(defaultProps.onTap).not.toHaveBeenCalled();
    });

    it('hides publication and archive actions for content editors', async () => {
        render(<AdminListTile {...defaultProps} canDelete={false} canPublish={false} />);

        fireEvent.pointerDown(screen.getByRole('button', { name: /actions for test title/i }));

        expect(await screen.findByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Duplicate')).toBeInTheDocument();
        expect(screen.queryByText('Unpublish')).not.toBeInTheDocument();
        expect(screen.queryByText('Archive')).not.toBeInTheDocument();
    });
});
