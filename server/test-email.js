import emailService from './services/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
    console.log('Testing email service...');
    
    // Check if email environment variables are set
    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        console.log('Missing email environment variables:', missing.join(', '));
        console.log('Email service will be disabled. Templates will still be loaded.');
    }
    
    try {
        await emailService.initialize();
        console.log('Email service initialized successfully');
        
        // Check if templates are loaded
        console.log('Loaded templates:', Object.keys(emailService.templates));
        
        // Test template rendering with dummy data
        if (emailService.templates.welcome) {
            const testUser = {
                email: 'test@example.com',
                fullName: 'Test User',
                businessName: 'Test Business'
            };
            const html = emailService.templates.welcome({
                name: testUser.fullName,
                email: testUser.email,
                businessName: testUser.businessName,
                loginUrl: 'http://localhost:3001/login'
            });
            console.log('Welcome template renders successfully, length:', html.length);
        }
        
        console.log('Email service test completed successfully');
        console.log('Note: Actual email sending requires valid SMTP credentials.');
    } catch (error) {
        console.error('Email service test failed:', error.message);
    }
}

testEmail();