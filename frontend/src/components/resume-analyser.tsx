"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ArrowRight,
  FileCheck,
  Zap,
} from "lucide-react";
import axios from "axios";
import { ResumeAnalysisResponse } from "@/type";
import { utils_service, useAppData } from "@/context/AppContext";
import { primaryPill } from "@/components/landing/primitives";
import Link from "next/link";
import toast from "react-hot-toast";

const ResumeAnalyzer = () => {
  const { isAuth } = useAppData();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResumeAnalysisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !=="application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeResume = async () => {
    if (!file) {
      toast.error("Please upload a resume");
      return;
    }

    setLoading(true);
    try {
      const base64 = await convertToBase64(file);
      const { data } = await axios.post(
        `${utils_service}/api/utils/resume-analyser`,
        {
          pdfBase64: base64,
        }
      );
      setResponse(data);
      toast.success("Resume analyzed successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message ||"Failed to analyze resume");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResponse(null);
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value ="";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-ok-text";
    if (score >= 60) return "text-warn-text";
    return "text-bad-text";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-ok-tint";
    if (score >= 60) return "bg-warn-tint";
    return "bg-bad-tint";
  };

  const getPriorityColor = (priority: string) => {
    if (priority ==="high")
      return "status-bad";
    if (priority ==="medium")
      return "bg-warn-tint text-warn-text border-yellow-200 800";
    return "bg-blue-100 900/30 text-blue-400 border-blue-200 800";
  };

  return (
    <>
        {!isAuth ? (
          <Link href="/login" className={primaryPill}>
            <FileText size={16} />
            Sign in to analyze
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-[1px]"
            />
          </Link>
        ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className={primaryPill}
            >
              <FileText size={16} />
              Analyze My Resume
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-[1px]"
              />
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {!response ? (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <FileText className="text-bad-text" />
                    Upload Your Resume
                  </DialogTitle>
                  <DialogDescription>
                    Upload your resume in PDF format to get an instant ATS
                    compatibility analysis
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed  p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16  bg-steel-100 flex items-center justify-center">
                        <Upload size={32} className="text-steel-700" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">
                          {file ? file.name :"Click to upload your resume"}
                        </p>
                        <p className="text-sm opacity-60">
                          PDF format only, maximum 5MB
                        </p>
                      </div>
                      {file && (
                        <div className="flex items-center gap-2 text-ok-text">
                          <CheckCircle2 size={18} />
                          <span className="text-sm font-medium">
                            File uploaded successfully
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <Button
                    onClick={analyzeResume}
                    disabled={loading || !file}
                    className="w-full h-11 gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Analyzing your resume...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Analyze Resume
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <FileCheck className="text-bad-text" />
                    Your Resume Analysis
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Overall Score */}
                  <div
                    className={`p-6  ${getScoreBgColor(
                      response.atsScore
                    )} border-2`}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium opacity-70 mb-2">
                        ATS Compatibility Score
                      </p>
                      <div
                        className={`text-6xl font-bold ${getScoreColor(
                          response.atsScore
                        )}`}
                      >
                        {response.atsScore}
                      </div>
                      <p className="text-sm opacity-70 mt-2">out of 100</p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div
                    className="p-4  border border-hairline bg-steel-100"
                  >
                    <p className="text-sm leading-relaxed">
                      {response.summary}
                    </p>
                  </div>

                  {/* Score Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp size={20} className="text-bad-text" />
                      Detailed Score Breakdown
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {Object.entries(response.scoreBreakdown).map(
                        ([key, value]) => (
                          <div key={key} className="p-4  border">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold capitalize">{key}</p>
                              <span
                                className={`text-lg font-bold ${getScoreColor(
                                  value.score
                                )}`}
                              >
                                {value.score}%
                              </span>
                            </div>
                            <p className="text-xs opacity-70">
                              {value.feedback}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div
                    className="p-4  border border-hairline bg-ok-tint"
                  >
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-ok-text" />
                      What Your Resume Does Well
                    </h3>
                    <ul className="space-y-2">
                      {response.strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-ok-text mt-0.5">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-bad-text" />
                      Recommendations for Improvement
                    </h3>
                    <div className="space-y-3">
                      {response.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-4  border">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="font-semibold text-sm">
                              {suggestion.category}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1  border 
${getPriorityColor(suggestion.priority)}`}
                            >
                              {suggestion.priority}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium opacity-70">
                                Issue:{""}
                              </span>
                              <span className="opacity-80">
                                {suggestion.issue}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium opacity-70">
                                Fix:{""}
                              </span>
                              <span className="opacity-80">
                                {suggestion.recommendation}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={resetDialog}
                    variant="outline"
                    className="w-full"
                  >
                    Analyze Another Resume
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ResumeAnalyzer;
