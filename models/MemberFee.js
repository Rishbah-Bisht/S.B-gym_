const mongoose = require('mongoose');

const memberFeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    feeAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'UPI', null],
        default: null
    },
    visitStartDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    visitEndDate: {
        type: Date
    },
    paidAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster searching
memberFeeSchema.index({ name: 1 });
memberFeeSchema.index({ visitStartDate: 1 });

module.exports = mongoose.model('MemberFee', memberFeeSchema);
