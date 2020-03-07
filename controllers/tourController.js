const Tour = require('./../models/tourModel');

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

exports.getAllTours = async (req, res) => {
	try {
		// console.log(req.query);
		// BUILD QUERY
		// 1) FILTERING
		const queryObj = {...req.query};
		const excludedFields = ['page', 'sort', 'limit', 'fields'];
		excludedFields.forEach(el => delete queryObj[el]);

		// 2) ADVANCED FILTERING
		let queryStr = JSON.stringify(queryObj);
		queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
		console.log(queryStr, JSON.parse(queryStr) );

		// { duration: {$gte: 5}, difficulty: 'easy' }
		// replace [gte, gt, lte, lt] to [$gte, $gt, $lte, $lt]

		let query = Tour.find(JSON.parse(queryStr));

		// 3) SORTING

		if (req.query.sort) {
			const sortBy = req.query.sort.split(',').join(' ');
			console.log(sortBy);
			query = query.sort(sortBy)
		} else {
			// query = query.sort('-createdAt')
			query = query.sort('-ratingsAverage')
		}

		// 4) FIELD LIMITING

		if (req.query.fields) {
			const fields = req.query.fields.split(',').join(' ');
			console.log(fields);
			query = query.select(fields)
		} else {
			query = query.select('-__v')
		}

		// 5) PAGINATION

		const page = req.query.page * 1 || 1; // *1 convert to number, default page
		const limit = req.query.limit * 1 || 100;
		const skip = (page - 1) * limit;

		// page=3&limit=10 1-10 page1, 11-20 page2, 21-30 page3,
		query = query.skip(skip).limit(limit);

		if (req.query.page) {
			const numTour = await Tour.countDocuments();
			if(skip >= numTour) throw new Error('This page does not exist');
		}

		// EXECUTE QUERY

		// const query = Tour.find({
		// 	duration: '5',
		// 	difficulty: 'easy'
		// });

		// const query = Tour.find()
		// 	.where('duration')
		// 	.equals(5)
		// 	.where('difficulty')
		// 	.equals('easy');

		const tours = await query;

		// SEND RESPONSE
		res.status(200).json({
			status: 'success',
			// requestedAt: req.requestTime,
			results: tours.length,
			data: {
				tours
			}
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		})
	}
};

exports.getTour = async (req, res) => {
	try {
		const tour = await Tour.findById(req.params.id);
		// const tour = await Tour.findOne({_id: req.params.id}); // this is the same
		res.status(200).json({
			status: 'success',
			data: {
				tour
			}
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		})
	}
};

exports.createTour = async (req, res) => {
	try {
		// const newTour = new Tour({});
		// newTour.save(req, res);

		const newTour = await Tour.create(req.body);

		res.status(201).json({
			status: 'success',
			data: {
				tour: newTour
			}
		});
	} catch (err) {
		res.status(400).json({
			status: 'fail',
			message: err
		})
	}

};

exports.updateTour = async (req, res) => {

	try {
		const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true
		});

		res.status(200).json({
			status: 'success',
			data: {
				tour
			}
		});

	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		})
	}
};

exports.deleteTour = async (req, res) => {

	try {
		await Tour.findByIdAndDelete(req.params.id);
		res.status(204).json({
			status: 'success',
			data: null
		});
	} catch (err) {
		res.status(404).json({
			status: 'fail',
			message: err
		})
	}
};
