import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const ResizerBar = styled.div`
  width: 6px;
  background-color: #f0f0f0;
  cursor: col-resize;
  position: relative;
  z-index: 10;
  transition: background-color 0.2s;
  
  &:hover, &.active {
    background-color: #1890ff;
  }

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 30px;
    background-color: #d9d9d9;
  }

  &:hover::before, &.active::before {
    background-color: #ffffff;
  }
`;

const Resizer = ({ onResize }) => {
  const resizerRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  useEffect(() => {
    const resizer = resizerRef.current;
    
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      resizer.classList.add('active');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };
    
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      
      if (onResize) {
        onResize(e.clientX);
      }
    };
    
    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      
      isDraggingRef.current = false;
      resizer.classList.remove('active');
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };
    
    resizer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      resizer.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);
  
  return <ResizerBar ref={resizerRef} />;
};

export default Resizer; 