const Event = require('../models/Event');

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('organizer', 'name email role').sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email role');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const data = req.body;
    const organizerId = req.user && req.user.id;
    if (!organizerId) return res.status(401).json({ message: 'Not authenticated' });

    // basic validation
    if (!data.title || typeof data.title !== 'string' || !data.title.trim())
      return res.status(400).json({ message: 'Title is required' });

    if (data.ticketTypes) {
      if (!Array.isArray(data.ticketTypes)) return res.status(400).json({ message: 'ticketTypes must be an array' });
      for (const tt of data.ticketTypes) {
        if (!tt.name || typeof tt.name !== 'string') return res.status(400).json({ message: 'Each ticket must have a name' });
        if (typeof tt.price !== 'number' || tt.price < 0) return res.status(400).json({ message: 'Ticket price must be a non-negative number' });
        if (typeof tt.quantity !== 'number' || tt.quantity < 0) return res.status(400).json({ message: 'Ticket quantity must be a non-negative number' });
      }
    }

    const event = new Event({ ...data, organizer: organizerId });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // only owner or admin can update
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (user.role !== 'admin' && event.organizer.toString() !== user.id)
      return res.status(403).json({ message: 'Forbidden' });

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (user.role !== 'admin' && event.organizer.toString() !== user.id)
      return res.status(403).json({ message: 'Forbidden' });

    await event.remove();
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
