const BoothPresidentRequest = require('../models/BoothPresidentRequest');
const User = require('../models/User');
const { getAssemblyMetadata } = require('../services/jurisdictionService');

// @desc    Apply to be a Volunteer
// @route   POST /api/booth-president/apply
const applyBoothPresident = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Check existing request
    let existing = await BoothPresidentRequest.findOne({ userId: user._id });

    if (existing) {
      if (existing.status === 'Approved') {
        return res.status(400).json({
          success: false,
          message: 'You are already an approved volunteer.',
          request: existing
        });
      }

      // Re-apply: update existing pending/rejected record
      existing.type = 'volunteer';
      existing.voterName = user.voterName;
      existing.epicNo = user.epicNo;
      existing.mobile = user.mobile;
      existing.gender = user.gender || 'Unspecified';
      existing.district = user.district || '';
      existing.assemblyName = user.assemblyName || '';
      existing.assemblyNo = user.assemblyNo || '';
      existing.boothNo = '';
      existing.isCustomBooth = false;
      existing.originalDistrict = '';
      existing.originalAssembly = '';
      existing.originalBoothNo = '';
      existing.status = 'Pending';
      existing.rejectionReason = '';
      existing.appliedAt = new Date();
      existing.actionDate = null;
      existing.actionBy = '';

      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Your volunteer application has been submitted successfully!',
        request: existing
      });
    }

    const newRequest = await BoothPresidentRequest.create({
      type: 'volunteer',
      userId: user._id,
      voterName: user.voterName,
      epicNo: user.epicNo,
      mobile: user.mobile,
      gender: user.gender || 'Unspecified',
      district: user.district || '',
      assemblyName: user.assemblyName || '',
      assemblyNo: user.assemblyNo || '',
      boothNo: '',
      isCustomBooth: false,
      status: 'Pending',
      appliedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Your volunteer application has been submitted successfully!',
      request: newRequest
    });
  } catch (error) {
    console.error('[applyVolunteer Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit volunteer application' });
  }
};

// @desc    Get current user's Booth President application status
// @route   GET /api/booth-president/my-status
const getMyBoothPresidentStatus = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const request = await BoothPresidentRequest.findOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      hasApplied: !!request,
      request: request || null
    });
  } catch (error) {
    console.error('[getMyBoothPresidentStatus Error]:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// @desc    Get public list of districts, assemblies & booths for custom selection
// @route   GET /api/booth-president/jurisdictions
const getPublicJurisdictions = async (req, res) => {
  try {
    const metadata = await getAssemblyMetadata();

    const districtSet = new Set();
    const assemblies = [];

    (metadata || []).forEach(item => {
      if (item.district) districtSet.add(item.district);
      assemblies.push({
        district: item.district,
        assemblyNo: item.assemblyNo,
        assemblyName: item.assemblyName,
        label: item.label
      });
    });

    const districts = Array.from(districtSet).sort();

    return res.status(200).json({
      success: true,
      districts,
      assemblies
    });
  } catch (error) {
    console.error('[getPublicJurisdictions Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch jurisdiction data' });
  }
};

// @desc    Get Booth President requests for Admin Dashboards
// @route   GET /api/admin/booth-president-requests
const getAdminBoothPresidentRequests = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const { page = 1, limit = 20, status, search, district, assemblyName } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    // Apply role-based jurisdiction filter
    if (admin.role === 'ASSEMBLY_ADMIN' && admin.assemblyName) {
      filter.assemblyName = new RegExp(`^${admin.assemblyName.trim()}$`, 'i');
    } else if (admin.role === 'DISTRICT_ADMIN' && admin.district) {
      filter.district = new RegExp(`^${admin.district.trim()}$`, 'i');
    } else {
      if (district) filter.district = new RegExp(`^${district.trim()}$`, 'i');
      if (assemblyName) filter.assemblyName = new RegExp(`^${assemblyName.trim()}$`, 'i');
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { voterName: regex },
        { epicNo: regex },
        { mobile: regex },
        { boothNo: regex }
      ];
    }

    const [requests, totalRequests, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      BoothPresidentRequest.find(filter)
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      BoothPresidentRequest.countDocuments(filter),
      BoothPresidentRequest.countDocuments({ ...filter, status: 'Pending' }),
      BoothPresidentRequest.countDocuments({ ...filter, status: 'Approved' }),
      BoothPresidentRequest.countDocuments({ ...filter, status: 'Rejected' })
    ]);

    const totalPages = Math.ceil(totalRequests / limitNum) || 1;

    return res.status(200).json({
      success: true,
      requests,
      totalRequests,
      totalPages,
      currentPage: pageNum,
      stats: {
        total: totalRequests,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    console.error('[getAdminBoothPresidentRequests Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch Booth President requests' });
  }
};

// @desc    Approve or Reject a Volunteer Request — Super Admin only
// @route   POST /api/admin/booth-president-requests/:id/action
const handleBoothPresidentAction = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    if (admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can approve or reject volunteer requests' });
    }

    const { id } = req.params;
    const { action, reason } = req.body;

    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be Approved or Rejected' });
    }

    const request = await BoothPresidentRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Volunteer request not found' });
    }

    request.status = action;
    request.rejectionReason = action === 'Rejected' ? (reason || 'Application declined by admin') : '';
    request.actionDate = new Date();
    request.actionBy = admin.username || admin.role;

    await request.save();

    return res.status(200).json({
      success: true,
      message: `Volunteer application ${action} successfully!`,
      request
    });
  } catch (error) {
    console.error('[handleVolunteerAction Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process volunteer request' });
  }
};

module.exports = {
  applyBoothPresident,
  getMyBoothPresidentStatus,
  getPublicJurisdictions,
  getAdminBoothPresidentRequests,
  handleBoothPresidentAction
};
