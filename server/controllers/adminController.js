const User     = require('../models/User');
const Resume   = require('../models/Resume');
const Analysis = require('../models/Analysis');
const { sendSuccess } = require('../utils/responseHelper');

/**
 * GET /api/admin/stats
 * Returns aggregate platform stats — admin only.
 */
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalResumes, topSkillsAgg] = await Promise.all([
      User.countDocuments(),
      Resume.countDocuments(),
      Analysis.aggregate([
        { $unwind: '$missingSkills' },
        { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, skill: '$_id', count: 1 } },
      ]),
    ]);

    return sendSuccess(res, { totalUsers, totalResumes, topSkills: topSkillsAgg });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
