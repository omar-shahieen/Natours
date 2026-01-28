import cron from 'node-cron';
import TourService from '../services/tourService.js';

const tourService = new TourService();

// Run every day at 3 AM
cron.schedule('0 3 * * *', async () => {
    console.log('Warming cache...');

    // Pre-cache popular tours
    await tourService.getTourStats();

    // Pre-cache top tours
    await tourService.getAllTours({ sort: '-ratingsAverage', limit: '10' });

    console.log('Cache warming completed');
});