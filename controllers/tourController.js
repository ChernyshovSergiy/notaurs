const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

// USING MIDDLEWARE
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

// exports.checkBody = (req, res, next) => {
// 	if (!req.body.name || !req.body.price) {
// 		return res.status(400).json({
// 			status: 'fail',
// 			message: 'Missing name or price'
// 		});
// 	}
// 	next();
// };

exports.getAllTours = catchAsync(async (req, res, next) => {
    // try {
    // // console.log(req.query);
    // // BUILD QUERY
    // // 1) FILTERING
    // const queryObj = {...req.query};
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach(el => delete queryObj[el]);
    //
    // // 2) ADVANCED FILTERING
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(queryStr, JSON.parse(queryStr) );
    //
    // // { duration: {$gte: 5}, difficulty: 'easy' }
    // // replace [gte, gt, lte, lt] to [$gte, $gt, $lte, $lt]
    //
    // let query = Tour.find(JSON.parse(queryStr));
    //
    // // 3) SORTING
    //
    // if (req.query.sort) {
    // 	const sortBy = req.query.sort.split(',').join(' ');
    // 	console.log(sortBy);
    // 	query = query.sort(sortBy)
    // } else {
    // 	// query = query.sort('-createdAt')
    // 	query = query.sort('-ratingsAverage')
    // }
    //
    // // 4) FIELD LIMITING
    //
    // if (req.query.fields) {
    // 	const fields = req.query.fields.split(',').join(' ');
    // 	console.log(fields);
    // 	query = query.select(fields)
    // } else {
    // 	query = query.select('-__v')
    // }
    //
    // // 5) PAGINATION
    //
    // const page = req.query.page * 1 || 1; // *1 convert to number, default page
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    //
    // // page=3&limit=10 1-10 page1, 11-20 page2, 21-30 page3,
    // query = query.skip(skip).limit(limit);
    //
    // if (req.query.page) {
    // 	const numTour = await Tour.countDocuments();
    // 	if(skip >= numTour) throw new Error('This page does not exist');
    // }
    //
    // // EXECUTE QUERY
    //
    // // const query = Tour.find({
    // // 	duration: '5',
    // // 	difficulty: 'easy'
    // // });
    //
    // // const query = Tour.find()
    // // 	.where('duration')
    // // 	.equals(5)
    // // 	.where('difficulty')
    // // 	.equals('easy');
    //
    // const tours = await query;

    // EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        // requestedAt: req.requestTime,
        results: tours.length,
        data: {
            tours,
        },
    });
    // } catch (err) {
    //   res.status(404).json({
    //     status: "fail",
    //     message: err
    //   });
    // }
});

exports.getTour = catchAsync(async (req, res, next) => {
    // const tour = await Tour.findById(req.params.id).populate('guides');
    // const tour = await Tour.findById(req.params.id).populate({
    //     path: 'guides',
    //     select: '-__v -passwordChangedAt'
    // });
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
        return next(new AppError(`Tour not found with this ID: ${req.params.id}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour,
        },
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour,
        },
    });
});

// exports.createTour = async (req, res) => {
//   try {
//     // const newTour = new Tour({});
//     // newTour.save(req, res);
//
//     const newTour = await Tour.create(req.body);
//
//     res.status(201).json({
//       status: "success",
//       data: {
//         tour: newTour
//       }
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: "fail",
//       message: err
//     });
//   }
//
// };

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

  if (!tour) {
    return next(new AppError(`Tour not found with this ID: ${req.params.id}`, 404));
  }

  res.status(200).json({
        status: 'success',
        data: {
            tour,
        },
    });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`Tour not found with this ID: ${req.params.id}`, 404));
  }

  res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
        // {
        //   $match: { _id: { $ne: 'EASY' } }
        // }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats,
        },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            $project: {
                _id: 0,
            },
        },
        {
            $sort: { numTourStarts: -1 },
        },
        {
            $limit: 12,
        },
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan,
        },
    });
});
