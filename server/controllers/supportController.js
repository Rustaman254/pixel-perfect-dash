import SupportTicket from '../models/SupportTicket.js';
import Notification from '../models/Notification.js';

export const submitTicket = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const ticketData = {
            userId: req.user ? req.user.id : null, // Support from logged in or guest
            name,
            email,
            subject,
            message
        };

        const ticket = await SupportTicket.create(ticketData);

        // Notify Admin
        await Notification.create({
            userId: null,
            title: "New Support Ticket",
            message: `A new ticket "${subject}" has been submitted by ${email}.`,
            type: 'alert'
        });

        res.status(201).json({ message: 'Support ticket submitted successfully', ticket });
    } catch (error) {
        console.error('Error submitting ticket:', error);
        res.status(500).json({ message: 'Failed to submit support ticket' });
    }
};

export const getTicketsForAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const tickets = await SupportTicket.findAllForAdmin();
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }
        
        const updated = await SupportTicket.updateStatus(id, status);
        res.status(200).json({ message: 'Ticket status updated', ticket: updated });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Failed to update ticket' });
    }
};
