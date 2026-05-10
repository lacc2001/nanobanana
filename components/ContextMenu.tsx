import React, { useRef, useEffect, useState } from 'react';
import type { Point, ElementType } from '../types';
import { COLORS } from '../App';

interface ContextMenuData {
    x: number;
    y: number;
    worldPoint: Point;
    elementId: string | null;
}

interface ContextMenuProps {
  menuData: ContextMenuData;
  onClose: () => void;
  actions: {
    addNote: (position: Point) => void;
    addArrow: (position: Point) => void;
    addDrawing: (position: Point) => void;
    editDrawing: (elementId: string) => void;
    startImageEdit: (elementId: string) => void;
    startOutpainting: (elementId: string) => void;
    addImage: (position: Point) => void;
    deleteElement: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    changeColor: (color: string) => void;
    downloadImage: (elementId: string) => void;
    duplicateElement: (elementId: string) => void;
    toggleLanguage: () => void;
    groupElements: () => void;
    ungroupElements: () => void;
  };
  canChangeColor: boolean;
  canGroup: boolean;
  canUngroup: boolean;
  elementType: ElementType | null;
  t: (key: string) => string;
}

const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; disabled?: boolean }> = ({ onClick, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-transparent"
    >
        {children}
    </button>
);

export const ContextMenu: React.FC<ContextMenuProps> = ({ menuData, onClose, actions, canChangeColor, canGroup, canUngroup, elementType, t }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [colorSubMenuVisible, setColorSubMenuVisible] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        // Use timeout to prevent the same click event that opened the menu from closing it
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    
    const handleAction = (action: Function) => {
        action();
        onClose();
    };
    
    const handleColorSubMenu = (e: React.MouseEvent) => {
        if (!canChangeColor) return;
        e.stopPropagation();
        setColorSubMenuVisible(true);
    };

    const menuStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${menuData.x}px`,
        top: `${menuData.y}px`,
        zIndex: 50,
    };
    
    const colorSubMenuStyle: React.CSSProperties = {
        position: 'absolute',
        left: '100%',
        top: 0,
        zIndex: 51,
    }

    return (
        <div
            ref={menuRef}
            style={menuStyle}
            className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1"
            onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing the menu via the main app listener
        >
            {menuData.elementId ? (
                // Element Menu
                <>
                    {canGroup && <MenuItem onClick={() => handleAction(actions.groupElements)}>{t('group')}</MenuItem>}
                    {canUngroup && <MenuItem onClick={() => handleAction(actions.ungroupElements)}>{t('ungroup')}</MenuItem>}
                    {(canGroup || canUngroup) && <div className="border-t my-1 border-gray-200" />}

                    {elementType === 'image' && (
                         <>
                            <MenuItem onClick={() => handleAction(() => actions.startImageEdit(menuData.elementId!))}>
                                {t('removeOrEditObject')}
                            </MenuItem>
                            <MenuItem onClick={() => handleAction(() => actions.startOutpainting(menuData.elementId!))}>
                                {t('expandImage')}
                            </MenuItem>
                             <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {elementType === 'drawing' && (
                         <>
                            <MenuItem onClick={() => handleAction(() => actions.editDrawing(menuData.elementId!))}>
                                {t('editDrawing')}
                            </MenuItem>
                             <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {(elementType === 'image' || elementType === 'drawing') && (
                        <>
                            <MenuItem onClick={() => handleAction(() => actions.downloadImage(menuData.elementId!))}>
                                {t('downloadImage')}
                            </MenuItem>
                            <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    {(elementType === 'note' || elementType === 'image' || elementType === 'drawing' || elementType === 'arrow') && (
                        <>
                           <MenuItem onClick={() => handleAction(() => actions.duplicateElement(menuData.elementId!))}>
                                {t('duplicate')}
                            </MenuItem>
                             <div className="border-t my-1 border-gray-200" />
                        </>
                    )}
                    <div className="relative" onMouseLeave={() => setColorSubMenuVisible(false)}>
                        <button
                            onMouseEnter={handleColorSubMenu}
                            disabled={!canChangeColor}
                            className="w-full flex justify-between items-center text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-transparent"
                        >
                            <span>{t('changeColor')}</span>
                            <span className="text-xs">▶</span>
                        </button>
                         {colorSubMenuVisible && canChangeColor && (
                             <div 
                                style={colorSubMenuStyle}
                                className="w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1"
                             >
                                 <div className="p-2 grid grid-cols-5 gap-2">
                                     {COLORS.map(color => (
                                         <button
                                             key={color.name}
                                             onClick={() => handleAction(() => actions.changeColor(color.bg))}
                                             className={`w-6 h-6 rounded-full border-2 ${color.bg} border-white`}
                                             aria-label={`Change color to ${color.name}`}
                                         />
                                     ))}
                                 </div>
                             </div>
                         )}
                    </div>
                    <div className="border-t my-1 border-gray-200" />
                    <MenuItem onClick={() => handleAction(actions.bringToFront)}>{t('bringToFront')}</MenuItem>
                    <MenuItem onClick={() => handleAction(actions.sendToBack)}>{t('sendToBack')}</MenuItem>
                    <div className="border-t my-1 border-gray-200" />
                    <MenuItem onClick={() => handleAction(actions.deleteElement)}>{t('delete')}</MenuItem>
                </>
            ) : (
                // Canvas Menu
                <>
                    <MenuItem onClick={() => handleAction(() => actions.addNote(menuData.worldPoint))}>{t('addNote')}</MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addArrow(menuData.worldPoint))}>{t('addArrow')}</MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addDrawing(menuData.worldPoint))}>{t('addDrawing')}</MenuItem>
                    <MenuItem onClick={() => handleAction(() => actions.addImage(menuData.worldPoint))}>{t('addImages')}</MenuItem>
                    <div className="border-t my-1 border-gray-200" />
                    <MenuItem onClick={() => handleAction(actions.toggleLanguage)}>{t('changeLanguage')}</MenuItem>
                </>
            )}
        </div>
    );
};