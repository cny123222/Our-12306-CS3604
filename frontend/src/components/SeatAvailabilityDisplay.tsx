import React from 'react';
import './SeatAvailabilityDisplay.css';

interface SeatAvailabilityDisplayProps {
  availableSeats: any;
}

/**
 * 余票状态显示组件
 */
const SeatAvailabilityDisplay: React.FC<SeatAvailabilityDisplayProps> = ({ availableSeats }) => {
  if (!availableSeats) return null;
  
  const formatSeats = () => {
    const seats = [];
    for (const [seatType, count] of Object.entries(availableSeats)) {
      if (count !== null && count !== undefined) {
        seats.push(`${seatType}余票 ${count} 张`);
      }
    }
    return seats.join('，');
  };
  
  return (
    <div className="seat-availability-display">
      <p className="availability-text">
        本次列车，{formatSeats()}
      </p>
    </div>
  );
};

export default SeatAvailabilityDisplay;

