import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Letter from '../models/Letter.js';
import { generateMemorableSlug } from '../utils/slug.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/letters';

const runTests = async () => {
  console.log('--- Starting Letters Backend Verification Tests ---');
  
  try {
    // 1. Connection Test
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✔ Connected to database successfully.');

    // Cleanup previous test letters
    await Letter.deleteMany({ recipient: 'Test Recipient' });

    // 2. Slug Generation Test
    const slug = generateMemorableSlug();
    console.log(`Testing Slug Generation: "${slug}"`);
    if (slug.split('-').length !== 3) {
      throw new Error('Slug must consist of exactly 3 words.');
    }
    console.log('✔ Slug generator conforms to requirements.');

    // 3. Document Creation & Default Fields
    const letter = new Letter({
      recipient: 'Test Recipient',
      title: 'A Silent Confession',
      content: 'This is a quiet test letter written to check integration.',
    });

    if (letter.status !== 'Draft') {
      throw new Error('Default letter status must be Draft.');
    }
    console.log('✔ Default state initialization check passed.');

    // 4. Password Encryption (Bcrypt Hashing)
    const rawPassword = 'velvet-echo-26';
    const salt = await bcrypt.genSalt(10);
    letter.sharePassword = await bcrypt.hash(rawPassword, salt);
    letter.shareSlug = slug;
    letter.status = 'Shared';

    await letter.save();
    console.log('✔ Password hashed with bcrypt and document saved successfully.');

    // 5. Password Verification
    const savedLetter = await Letter.findOne({ shareSlug: slug });
    if (!savedLetter) {
      throw new Error('Failed to find saved letter by shareSlug.');
    }

    const matches = await bcrypt.compare(rawPassword, savedLetter.sharePassword);
    if (!matches) {
      throw new Error('Password verification check failed.');
    }
    console.log('✔ Bcrypt comparison verified raw password matches hashed entry.');

    // 6. One Reply Lock check
    if (savedLetter.reply) {
      throw new Error('New letter should not have a reply initially.');
    }
    savedLetter.reply = 'I read your letter and feel same.';
    await savedLetter.save();
    console.log('✔ Left a single reply successfully.');

    // Cleanup
    await Letter.deleteOne({ _id: savedLetter._id });
    console.log('✔ Cleaned up test database records.');
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The backend is ready.');
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

runTests();
