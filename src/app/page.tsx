"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "components/Button";
import { AddJobForm } from "components/AddJobForm";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  status: string;
  date_applied: string;
  has_tailored_resume: boolean;
  tailored_resume_id?: number;
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddJobForm, setShowAddJobForm] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobsData = await response.json();
      setJobs(jobsData);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const createTailoredResume = async (jobId: number) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/tailored-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tailored resume');
      }
      
      const result = await response.json();
      
      // Update local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId 
            ? { ...job, has_tailored_resume: true, tailored_resume_id: result.tailored_resume_id }
            : job
        )
      );
    } catch (err) {
      console.error("Error creating tailored resume:", err);
      setError("Failed to create tailored resume");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-yellow-100 text-yellow-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchJobs} className="mt-4">
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
        <p className="mt-2 text-gray-600">
          Manage your job applications and create tailored resumes for each position.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-4">
        <button
          onClick={() => setShowAddJobForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Add Job Application
        </button>
        <Link href="/resume-builder" className="btn-primary">
          Create New Resume
        </Link>
        <Link href="/resume-parser" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          Parse Existing Resume
        </Link>
        <Link href="/original-landing" className="text-blue-600 hover:text-blue-800 underline">
          View Original Landing Page
        </Link>
      </div>

      {/* Jobs Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                    Position
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Company
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Location
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Applied Date
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Tailored Resume
                  </th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {job.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.company}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.location}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {new Date(job.date_applied).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {job.has_tailored_resume ? (
                        <div className="flex items-center">
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            ✓ Created
                          </span>
                          {job.tailored_resume_id && (
                            <Link 
                              href={`/resume-builder?resumeId=${job.tailored_resume_id}`}
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          Not Created
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      {job.has_tailored_resume ? (
                        <Link
                          href={`/resume-builder?resumeId=${job.tailored_resume_id}&jobId=${job.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit Resume
                        </Link>
                      ) : (
                        <button
                          onClick={() => createTailoredResume(job.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Create Resume
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job applications found</h3>
          <p className="text-gray-500 mb-4">Start by adding your job applications to create tailored resumes.</p>
          <Link href="/resume-builder" className="btn-primary">
            Create Your First Resume
          </Link>
        </div>
      )}

      {/* Add Job Form Modal */}
      {showAddJobForm && (
        <AddJobForm
          onJobAdded={() => {
            setShowAddJobForm(false);
            fetchJobs(); // Refresh the jobs list
          }}
          onCancel={() => setShowAddJobForm(false)}
        />
      )}
    </main>
  );
}
