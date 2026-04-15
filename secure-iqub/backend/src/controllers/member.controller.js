'use strict';

const SlotMemberContribution = require('../models/SlotMemberContribution');
const Payment = require('../models/Payment');
const SpinResult = require('../models/SpinResult');
const PayoutDistribution = require('../models/PayoutDistribution');
const Notification = require('../models/Notification');
const analyticsService = require('../services/analytics.service');
const { PAYMENT_STATUS } = require('../config/constants');
const { success, notFound } = require('../utils/response');

const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await analyticsService.getMemberDashboard(req.user._id);
    return success(res, dashboard);
  } catch (err) { next(err); }
};

const getMyPayments = async (req, res, next) => {
  try {
    const { groupId, monthNumber } = req.query;
    const query = { member: req.user._id };
    if (groupId) query.group = groupId;
    if (monthNumber) query.monthNumber = parseInt(monthNumber);

    const payments = await Payment.find(query)
      .populate('slot', 'slotNumber label')
      .populate('group', 'name')
      .sort({ monthNumber: -1 });

    return success(res, payments);
  } catch (err) { next(err); }
};

const getMySlot = async (req, res, next) => {
  try {
    const contribs = await SlotMemberContribution.find({ member: req.user._id, isActive: true })
      .populate('slot', 'slotNumber label status wonInMonth payoutAmount requiredMonthlyAmount assignedMonthlyAmount')
      .populate('group', 'name status currentMonth startDate endDate');
    return success(res, contribs);
  } catch (err) { next(err); }
};

const getMyPenalties = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      member: req.user._id,
      penaltyAmount: { $gt: 0 },
    }).populate('group', 'name').populate('slot', 'slotNumber');
    return success(res, payments);
  } catch (err) { next(err); }
};

const getWinnerHistory = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const history = await SpinResult.find({ group: groupId })
      .sort('-monthNumber')
      .populate('winnerSlot', 'slotNumber label')
      .populate('triggeredBy', 'firstName lastName');
    return success(res, history);
  } catch (err) { next(err); }
};

const getMyPayoutStatus = async (req, res, next) => {
  try {
    const distributions = await PayoutDistribution.find({ member: req.user._id })
      .populate('group', 'name')
      .populate('slot', 'slotNumber label');
    return success(res, distributions);
  } catch (err) { next(err); }
};

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Notification.countDocuments({ recipient: req.user._id });
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return success(res, { notifications, unreadCount: await Notification.countDocuments({ recipient: req.user._id, isRead: false }) });
  } catch (err) { next(err); }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipient: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    return success(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
};

module.exports = {
  getDashboard, getMyPayments, getMySlot, getMyPenalties,
  getWinnerHistory, getMyPayoutStatus,
  getNotifications, markNotificationRead,
};
