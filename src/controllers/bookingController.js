const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');

exports.createBooking = async (req, res) => {
  const { eventId, tickets } = req.body; // tickets: [{ name, quantity }]
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  if (!eventId || !Array.isArray(tickets) || tickets.length === 0)
    return res.status(400).json({ message: 'Invalid payload' });

  // basic validation
  for (const t of tickets) {
    if (!t || typeof t.name !== 'string' || !t.name.trim() || typeof t.quantity === 'undefined')
      return res.status(400).json({ message: 'Each ticket must have a name and quantity' });
    const q = parseInt(t.quantity, 10);
    if (isNaN(q) || q <= 0) return res.status(400).json({ message: 'Quantity must be a positive integer' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }

    // Ensure event date is not in the past
    if (event.date && new Date(event.date) < new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cannot book tickets for past events' });
    }

    let totalPrice = 0;
    const bookingTickets = [];

    for (const reqTicket of tickets) {
      const { name, quantity } = reqTicket;
      const qty = parseInt(quantity, 10);
      if (!name || !qty || qty <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid ticket request' });
      }

      const tt = event.ticketTypes.find((t) => t.name === name);
      if (!tt) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Ticket type ${name} not found` });
      }
      if (typeof tt.quantity === 'undefined' || tt.quantity < qty) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Not enough tickets for ${name}` });
      }

      // deduct
      tt.quantity -= qty;
      totalPrice += tt.price * qty;
      bookingTickets.push({ name: tt.name, price: tt.price, quantity: qty });
    }

    await event.save({ session });

    const booking = new Booking({ user: userId, event: event._id, tickets: bookingTickets, totalPrice });
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMyBookings = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const bookings = await Booking.find({ user: userId }).populate('event').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
