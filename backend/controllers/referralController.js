const User = require('../models/User');
const SchemeApplication = require('../models/SchemeApplication');

// @desc    Get user's referral code, link, and list of referred members
// @route   GET /api/referrals/my-referrals
// @access  Private (User)
const getReferralStats = async (req, res) => {
  try {
    const user = req.user;
    const matchCodes = [user.referralCode, user.epicNo, user.mobile].filter(Boolean);

    // Fetch L1 referred users (people this user directly referred)
    const referredUsers = await User.find({ referredBy: { $in: matchCodes } })
      .select('_id voterName district referralCode')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch L2 counts in ONE bulk aggregation — no N+1
    const l1Codes = referredUsers.map(u => u.referralCode).filter(Boolean);
    const l2CountMap = {};
    if (l1Codes.length > 0) {
      const l2Raw = await User.aggregate([
        { $match: { referredBy: { $in: l1Codes } } },
        { $group: { _id: '$referredBy', count: { $sum: 1 } } }
      ]);
      l2Raw.forEach(r => { if (r._id) l2CountMap[r._id] = r.count; });
    }

    const totalNetwork = Object.values(l2CountMap).reduce((a, b) => a + b, 0);

    const referredMembers = referredUsers.map(refUser => ({
      id: refUser._id,
      voterName: refUser.voterName,
      district: refUser.district,
      level2Count: l2CountMap[refUser.referralCode] || 0
    }));

    return res.status(200).json({
      success: true,
      referralCode: user.referralCode,
      totalDirect: referredMembers.length,
      totalNetwork,
      totalImpact: referredMembers.length + totalNetwork,
      totalReferred: referredMembers.length, // backward compat
      referredMembers
    });
  } catch (error) {
    console.error('[getReferralStats Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load referral data' });
  }
};

module.exports = {
  getReferralStats
};
