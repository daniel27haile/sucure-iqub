'use strict';

/**
 * Seed script — creates demo data for development/testing.
 *
 * Run: node seeds/seed.js
 *
 * Creates:
 *   - 1 Super Admin
 *   - 1 Admin
 *   - 12 Members (10 single-owner slots + 2 shared slots → 12 full slots)
 *   - 1 Group (draft state, ready to activate)
 *   - 12 Slots with realistic contribution splits
 *
 * Slot composition:
 *   Slots 1-10: single owner ($2,000 each)
 *   Slot 11: shared — Member A ($1,000) + Member B ($1,000)
 *   Slot 12: shared — Member C ($500) + Member D ($1,500)
 *   All 12 slots × $2,000 = $24,000/month ✓
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Slot = require('../src/models/Slot');
const SlotMemberContribution = require('../src/models/SlotMemberContribution');
const PlatformSetting = require('../src/models/PlatformSetting');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/secure-iqub';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clean slate
  await Promise.all([
    User.deleteMany({}),
    Group.deleteMany({}),
    Slot.deleteMany({}),
    SlotMemberContribution.deleteMany({}),
    PlatformSetting.deleteMany({}),
  ]);
  console.log('🧹 Cleared existing data');

  const saltRounds = 12;

  // ── Platform Settings ─────────────────────────────────────────────────────
  await PlatformSetting.create({ key: 'global', penaltyPerDay: 20, platformFeePercent: 0, awardBadgeEnabled: true });

  // ── Super Admin ───────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    firstName: 'System',
    lastName: 'Admin',
    email: 'superadmin@secureiqub.com',
    password: 'SuperAdmin@123',
    role: 'super_admin',
    isEmailVerified: true,
    isActive: true,
  });
  console.log('👑 Super Admin:', superAdmin.email);

  // ── Admin ─────────────────────────────────────────────────────────────────
  const admin = await User.create({
    firstName: 'Dawit',
    lastName: 'Haile',
    email: 'admin@secureiqub.com',
    password: 'Admin@1234',
    role: 'admin',
    isEmailVerified: true,
    isActive: true,
    createdBy: superAdmin._id,
  });
  console.log('🛡️  Admin:', admin.email);

  // ── 14 Members (covers single + shared slots) ─────────────────────────────
  const memberData = [
    { firstName: 'Abebe', lastName: 'Girma',    email: 'abebe@demo.com' },
    { firstName: 'Tigist', lastName: 'Bekele',  email: 'tigist@demo.com' },
    { firstName: 'Solomon', lastName: 'Tesfaye', email: 'solomon@demo.com' },
    { firstName: 'Hiwot', lastName: 'Alemu',    email: 'hiwot@demo.com' },
    { firstName: 'Yonas', lastName: 'Mulugeta', email: 'yonas@demo.com' },
    { firstName: 'Meron', lastName: 'Tadesse',  email: 'meron@demo.com' },
    { firstName: 'Eyob', lastName: 'Kebede',    email: 'eyob@demo.com' },
    { firstName: 'Selamawit', lastName: 'Hailu', email: 'selam@demo.com' },
    { firstName: 'Biruk', lastName: 'Worku',    email: 'biruk@demo.com' },
    { firstName: 'Aster', lastName: 'Desta',    email: 'aster@demo.com' },
    // Shared slot 11
    { firstName: 'Kalid', lastName: 'Ibrahim',  email: 'kalid@demo.com' },
    { firstName: 'Saba', lastName: 'Tesfay',    email: 'saba@demo.com' },
    // Shared slot 12
    { firstName: 'Nati', lastName: 'Bekele',    email: 'nati@demo.com' },
    { firstName: 'Liya', lastName: 'Haile',     email: 'liya@demo.com' },
  ];

  const hashedMemberPassword = await bcrypt.hash('Member@1234', saltRounds);
  const members = await User.insertMany(
    memberData.map((m) => ({
      ...m,
      password: hashedMemberPassword,
      role: 'member',
      isEmailVerified: true,
      isActive: true,
      createdBy: admin._id,
    }))
  );
  console.log(`👥 Created ${members.length} members`);

  // ── Group ─────────────────────────────────────────────────────────────────
  const group = await Group.create({
    name: 'Haile Family Iqub 2025',
    description: 'A 12-slot, interest-free rotating savings circle. Monthly contribution: $2,000 per slot. Monthly payout: $24,000.',
    admin: admin._id,
    status: 'draft',
    cycleLength: 12,
    slotCount: 12,
    slotAmount: 2000,
    monthlyPool: 24000,
    slotPayout: 24000,
    dueDay: 1,
    platformFeePercent: 0,
    createdBy: admin._id,
  });
  console.log('🏦 Group created:', group.name);

  // ── Slots ─────────────────────────────────────────────────────────────────
  // Slots 1-10: single owner
  const singleOwnerSlots = [];
  for (let i = 0; i < 10; i++) {
    const slot = await Slot.create({
      group: group._id,
      slotNumber: i + 1,
      label: `Slot ${i + 1} — ${members[i].firstName}`,
      requiredMonthlyAmount: 2000,
      assignedMonthlyAmount: 2000,
      status: 'valid',
      payoutSplitStrategy: 'proportional',
      payoutAmount: 24000,
      createdBy: admin._id,
    });
    singleOwnerSlots.push(slot);

    await SlotMemberContribution.create({
      group: group._id,
      slot: slot._id,
      member: members[i]._id,
      monthlyAmount: 2000,
      sharePercent: 100,
      createdBy: admin._id,
    });
  }

  // Slot 11: shared — Kalid ($1,000) + Saba ($1,000)
  const slot11 = await Slot.create({
    group: group._id,
    slotNumber: 11,
    label: 'Slot 11 — Kalid & Saba',
    requiredMonthlyAmount: 2000,
    assignedMonthlyAmount: 2000,
    status: 'valid',
    payoutSplitStrategy: 'proportional',
    payoutAmount: 24000,
    createdBy: admin._id,
  });
  await SlotMemberContribution.insertMany([
    { group: group._id, slot: slot11._id, member: members[10]._id, monthlyAmount: 1000, sharePercent: 50, createdBy: admin._id },
    { group: group._id, slot: slot11._id, member: members[11]._id, monthlyAmount: 1000, sharePercent: 50, createdBy: admin._id },
  ]);

  // Slot 12: shared — Nati ($500) + Liya ($1,500)
  const slot12 = await Slot.create({
    group: group._id,
    slotNumber: 12,
    label: 'Slot 12 — Nati & Liya',
    requiredMonthlyAmount: 2000,
    assignedMonthlyAmount: 2000,
    status: 'valid',
    payoutSplitStrategy: 'proportional',
    payoutAmount: 24000,
    createdBy: admin._id,
  });
  await SlotMemberContribution.insertMany([
    { group: group._id, slot: slot12._id, member: members[12]._id, monthlyAmount: 500, sharePercent: 25, createdBy: admin._id },
    { group: group._id, slot: slot12._id, member: members[13]._id, monthlyAmount: 1500, sharePercent: 75, createdBy: admin._id },
  ]);

  console.log('🎰 Created 12 slots (10 single-owner, 2 shared)');
  console.log('   Slot 11: Kalid $1,000 + Saba $1,000 = $2,000 ✓');
  console.log('   Slot 12: Nati $500 + Liya $1,500 = $2,000 ✓');
  console.log('   Total monthly pool: 12 × $2,000 = $24,000 ✓');
  console.log('   Per-slot payout: $24,000 ✓');

  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Super Admin: superadmin@secureiqub.com / SuperAdmin@123');
  console.log('  Admin:       admin@secureiqub.com / Admin@1234');
  console.log('  Member:      abebe@demo.com / Member@1234');
  console.log('\nGroup "Haile Family Iqub 2025" is in DRAFT state — ready to activate.\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
