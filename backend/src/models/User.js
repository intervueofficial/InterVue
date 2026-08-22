import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      
      
      
      
      
      
      
      unique: true,
      sparse: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
    type: String,
    enum: ["admin", "interviewer", "candidate"],
    default: null,
},
isActive: {
    type: Boolean,
    default: true
},









interviewerApproval: {
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  note: { type: String, default: "" },
},
















identityVerification: {
  provider: { type: String, default: "" }, 
  verified: { type: Boolean, default: false },
  aadhaarHash: {
    type: String,
    
    
    
    
    
    
    
    
    
    
    
    
    
    unique: true,
    sparse: true,
  },
  
  
  
  
  verifiedName: { type: String, default: "" },
  verifiedDob: { type: String, default: "" }, 
  maskedAadhaar: { type: String, default: "" }, 
  verifiedAt: { type: Date, default: null },
},




candidateProfile: {
  phone: { type: String, default: "" },

  degree: { type: String, default: "" }, 
  fieldOfStudy: { type: String, default: "" }, 
  institution: { type: String, default: "" },
  yearOfGraduation: { type: Number, default: null },

  experienceYears: { type: Number, default: 0 },

  skills: {
    type: [String],
    default: [],
  },

  resumeUrl: { type: String, default: "" },

  
  
  
  
  
  
  resumeText: { type: String, default: "" },

  isComplete: {
    type: Boolean,
    default: false,
  },
},
  },
  { timestamps: true } 
);







function resetInterviewerApprovalToPending(target) {
  target.interviewerApproval = {
    status: "pending",
    requestedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    note: "",
  };
}


userSchema.pre("save", function (next) {
  if (this.isModified("role") && this.role === "interviewer") {
    resetInterviewerApprovalToPending(this);
  }
  next();
});




userSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  const update = this.getUpdate() || {};
  const nextRole = update.role ?? update.$set?.role;

  if (nextRole === "interviewer") {
    if (!update.$set) update.$set = {};
    update.$set.interviewerApproval = {
      status: "pending",
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      note: "",
    };
    this.setUpdate(update);
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
