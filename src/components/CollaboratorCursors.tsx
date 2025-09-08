import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollaboratorCursor, CollaboratorSelection } from '../hooks/useRealtimeCollaboration';

interface CollaboratorCursorsProps {
  cursors: CollaboratorCursor[];
  selections: CollaboratorSelection[];
}

const CursorSVG = ({ color }: { color: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      filter: `drop-shadow(0 0 2px rgba(0,0,0,0.3))`
    }}
  >
    <path
      d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
      fill={color}
      stroke="white"
      strokeWidth="1"
    />
  </svg>
);

const SelectionBox = ({ selection }: { selection: CollaboratorSelection }) => {
  if (!selection.selectionBounds) return null;
  
  return (
    <div
      className="absolute pointer-events-none border-2 rounded-md"
      style={{
        left: selection.selectionBounds.x,
        top: selection.selectionBounds.y,
        width: selection.selectionBounds.width,
        height: selection.selectionBounds.height,
        borderColor: selection.userColor,
        backgroundColor: `${selection.userColor}10`,
        zIndex: 1000
      }}
    >
      <div
        className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap"
        style={{
          backgroundColor: selection.userColor,
          fontSize: '11px'
        }}
      >
        {selection.userName}
      </div>
    </div>
  );
};

export default function CollaboratorCursors({ cursors, selections }: CollaboratorCursorsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1001 }}>
      {/* Curseurs des collaborateurs */}
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.userId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: cursor.position.x,
              y: cursor.position.y
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              stiffness: 500, 
              damping: 30,
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            className="absolute"
            style={{
              transform: 'translate(-2px, -2px)',
              zIndex: 1001
            }}
          >
            <CursorSVG color={cursor.userColor} />
            
            {/* Label du nom d'utilisateur */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.1 }}
              className="absolute top-6 left-2 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap"
              style={{
                backgroundColor: cursor.userColor,
                fontSize: '11px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {cursor.userName}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Sélections des collaborateurs */}
      <AnimatePresence>
        {selections.map((selection) => (
          <motion.div
            key={selection.userId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SelectionBox selection={selection} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}