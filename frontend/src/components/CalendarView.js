import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button, Modal } from 'react-bootstrap';

const localizer = momentLocalizer(moment);

const CalendarView = ({ deadlines }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dateEvents, setDateEvents] = useState([]);

  const events = deadlines.map(deadline => ({
    id: deadline._id,
    title: deadline.title,
    start: new Date(deadline.deadline),
    end: new Date(deadline.deadline),
    allDay: false,
    deadline
  }));

  const handleSelectSlot = (slotInfo) => {
    const date = slotInfo.start;
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    const eventsForDate = events.filter(event => 
      moment(event.start).format('YYYY-MM-DD') === dateStr
    );
    
    setSelectedDate(date);
    setDateEvents(eventsForDate);
    setShowModal(true);
  };

  return (
    <div className="mt-4" style={{ height: 500 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month']}
        onSelectSlot={handleSelectSlot}
        selectable
      />
      
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Deadlines for {selectedDate && moment(selectedDate).format('MMMM D, YYYY')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dateEvents.length === 0 ? (
            <p>No deadlines for this date</p>
          ) : (
            <ul className="list-group">
              {dateEvents.map(event => (
                <li key={event.id} className="list-group-item">
                  <strong>{event.title}</strong>
                  <div className="text-muted">
                    {moment(event.start).format('h:mm A')}
                  </div>
                  {event.deadline.description && (
                    <div className="mt-1">{event.deadline.description}</div>
                  )}
                  <div className="mt-1">
                    <span className="badge bg-primary me-1">
                      {event.deadline.priority}
                    </span>
                    <span className="badge bg-secondary">
                      {event.deadline.category}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarView;