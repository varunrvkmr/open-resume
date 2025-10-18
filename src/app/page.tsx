// openresume/src/app/page.tsx
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "components/Button"
import { AddJobForm } from "components/AddJobForm"

interface Job {
  id: number
  title: string
  company: string
  location: string
  status: string
  date_applied: string
  has_tailored_resume: boolean
  tailored_resume_id?: number
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddJobForm, setShowAddJobForm] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  const [creatingResume, setCreatingResume] = useState<number | null>(null)

  useEffect(() => {
    // Try to get user info from URL parameters
    const getUserInfo = () => {
      console.log("🔍 Checking for user info...")

      // Check for user info in URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const userInfoParam = urlParams.get("userInfo")

      if (userInfoParam) {
        try {
          const decoded = JSON.parse(decodeURIComponent(userInfoParam))
          console.log("✅ User info found in URL:", decoded)
          return decoded
        } catch (err) {
          console.error("❌ Failed to parse user info:", err)
        }
      }

      // Check localStorage for stored user info
      const storedUserInfo = localStorage.getItem("userInfo")
      if (storedUserInfo) {
        try {
          const parsed = JSON.parse(storedUserInfo)
          console.log("✅ User info found in localStorage:", parsed)
          return parsed
        } catch (err) {
          console.error("❌ Failed to parse stored user info:", err)
        }
      }

      console.log("❌ No user info found")
      return null
    }

    const user = getUserInfo()
    setUserInfo(user)

    if (user && user.email && user.email !== 'Loading...') {
      // Store user info for future use
      localStorage.setItem("userInfo", JSON.stringify(user))
      console.log("✅ User info stored, fetching jobs...")
      fetchJobs(user)
    } else {
      console.log("❌ No user info or invalid user data:", user)
      setError("Please log in to view your job applications. Make sure you're accessing OpenResume from the main JobTrackr application.")
      setLoading(false)
    }
  }, [])

  const fetchJobs = async (user?: any, page: number = 1, perPage: number = 10) => {
    const userToUse = user || userInfo
    console.log("📡 Fetching jobs for user:", userToUse, "page:", page, "perPage:", perPage)
    console.log("📡 User email being sent:", userToUse?.email)

    if (!userToUse?.email || userToUse.email === 'Loading...') {
      console.error("❌ Invalid user email:", userToUse?.email)
      setError("Invalid user data. Please access OpenResume from the main JobTrackr application.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Call your backend API with user email and pagination parameters
      const response = await fetch(`/api/jobs?userEmail=${encodeURIComponent(userToUse.email)}&page=${page}&per_page=${perPage}`, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 API response status:", response.status)

      if (!response.ok) {
        if (response.status === 401) {
          console.log("🔒 Unauthorized, clearing user info")
          localStorage.removeItem("userInfo")
          setError("Please log in to view your job applications")
          return
        }
        throw new Error("Failed to fetch jobs")
      }

      const responseData = await response.json()
      console.log("✅ Jobs fetched successfully:", responseData.jobs?.length || 0, "jobs")
      console.log("📋 Pagination info:", responseData.pagination)
      console.log("📋 Sample job data:", responseData.jobs?.slice(0, 2)) // Log first 2 jobs for debugging
      
      setJobs(responseData.jobs || [])
      setPagination(responseData.pagination || {
        page: 1,
        per_page: 10,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      })
    } catch (err) {
      console.error("❌ Error fetching jobs:", err)
      setError("Failed to fetch jobs")
    } finally {
      setLoading(false)
    }
  }

  const createTailoredResume = async (jobId: number) => {
    try {
      setCreatingResume(jobId)
      console.log("📝 Creating tailored resume for job:", jobId)

      if (!userInfo?.email) {
        console.error("❌ No user email found")
        setError("Please log in to create tailored resumes")
        return
      }

      const response = await fetch(`/api/jobs/${jobId}/tailored-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: userInfo.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ API Error:", errorData)
        
        // Handle specific error for missing master resume
        if (errorData.error && errorData.error.includes("No master resume found")) {
          const shouldCreateMaster = window.confirm(
            "You need to create a master resume first before creating tailored resumes. Would you like to create a master resume now?"
          )
          if (shouldCreateMaster) {
            window.location.href = "/resume-builder?master=true"
          }
          return
        }
        
        setError(errorData.error || "Failed to create tailored resume")
        return
      }

      const result = await response.json()
      console.log("✅ Tailored resume created:", result)

      // Update local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, has_tailored_resume: true, tailored_resume_id: result.tailored_resume_id } : job,
        ),
      )

      // Navigate to resume builder with the tailored resume
      const userInfoEncoded = encodeURIComponent(JSON.stringify(userInfo))
      const resumeBuilderUrl = `/resume-builder?resumeId=${result.tailored_resume_id}&jobId=${jobId}&userInfo=${userInfoEncoded}`
      console.log("🔗 Navigating to resume builder:", resumeBuilderUrl)
      window.location.href = resumeBuilderUrl
    } catch (err) {
      console.error("❌ Error creating tailored resume:", err)
      setError("Failed to create tailored resume")
    } finally {
      setCreatingResume(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800"
      case "interview":
        return "bg-yellow-100 text-yellow-800"
      case "offer":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleLoginRedirect = () => {
    console.log("🔗 Redirecting to main app login")
    // Redirect to the main application login
    window.location.href = "http://localhost:3000/login"
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          {userInfo ? (
            <Button onClick={() => fetchJobs()} className="mt-4">
              Try Again
            </Button>
          ) : (
            <div className="mt-4">
              <Button
                onClick={handleLoginRedirect}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Log In
              </Button>
              <p className="mt-2 text-sm text-gray-500">You'll be redirected to the main application to log in</p>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ... rest of your component remains the same
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
        <Link href="/resume-builder?master=true" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
          Create Master Resume
        </Link>
        <Link href="/resume-builder" className="btn-primary">
          Create New Resume
        </Link>
        <Link href="/resume-parser" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
          Parse Existing Resume
        </Link>
      </div>

      {/* Jobs Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] w-full">
            {/* Header */}
            <div className="grid grid-cols-7 gap-4 border-b border-gray-300 bg-gray-50 px-4 py-3.5">
              <div className="text-left text-sm font-semibold text-gray-900">Position</div>
              <div className="text-left text-sm font-semibold text-gray-900">Company</div>
              <div className="text-left text-sm font-semibold text-gray-900">Location</div>
              <div className="text-left text-sm font-semibold text-gray-900">Status</div>
              <div className="text-left text-sm font-semibold text-gray-900">Applied Date</div>
              <div className="text-left text-sm font-semibold text-gray-900">Tailored Resume</div>
              <div className="text-right text-sm font-semibold text-gray-900">Actions</div>
            </div>

            {/* Body */}
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div key={job.id} className="grid grid-cols-7 gap-4 px-4 py-4 hover:bg-gray-50">
                  <div className="text-sm font-medium text-gray-900 break-words">{job.title}</div>
                  <div className="text-sm text-gray-500 break-words">{job.company}</div>
                  <div className="text-sm text-gray-500 break-words">{job.location}</div>
                  <div className="text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(job.status || "Unknown")}`}
                    >
                      {job.status || "Unknown"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.date_applied ? new Date(job.date_applied).toLocaleDateString() : "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {job.has_tailored_resume ? (
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          ✓ Created
                        </span>
                        {job.tailored_resume_id && (
                          <Link
                            href={`/resume-builder?resumeId=${job.tailored_resume_id}`}
                            className="text-blue-600 hover:text-blue-800 text-xs"
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
                  </div>
                  <div className="text-right text-sm font-medium">
                    {job.has_tailored_resume ? (
                      <Link
                        href={`/resume-builder?resumeId=${job.tailored_resume_id}&jobId=${job.id}&userInfo=${encodeURIComponent(JSON.stringify(userInfo))}`}
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => {
                          console.log('🔗 Edit Resume clicked for job:', job.id, 'tailored_resume_id:', job.tailored_resume_id);
                          console.log('🔗 Generated URL:', `/resume-builder?resumeId=${job.tailored_resume_id}&jobId=${job.id}&userInfo=${encodeURIComponent(JSON.stringify(userInfo))}`);
                        }}
                      >
                        Edit Resume
                      </Link>
                    ) : (
                      <button
                        onClick={() => createTailoredResume(job.id)}
                        disabled={creatingResume === job.id}
                        className={`text-blue-600 hover:text-blue-900 ${creatingResume === job.id ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {creatingResume === job.id ? "Creating..." : "Create Resume"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {jobs.length > 0 && pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.per_page) + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} jobs
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchJobs(userInfo, pagination.page - 1, pagination.per_page)}
              disabled={!pagination.has_prev}
              className={`px-3 py-1 text-sm rounded-md ${
                pagination.has_prev
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const pageNum = Math.max(1, pagination.page - 2) + i;
              if (pageNum > pagination.total_pages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => fetchJobs(userInfo, pageNum, pagination.per_page)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pageNum === pagination.page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => fetchJobs(userInfo, pagination.page + 1, pagination.per_page)}
              disabled={!pagination.has_next}
              className={`px-3 py-1 text-sm rounded-md ${
                pagination.has_next
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No job applications found</h3>
          <p className="text-gray-500 mb-4">Start by creating a master resume, then add job applications to create tailored resumes.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/resume-builder?master=true" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
              Create Master Resume
            </Link>
            <Link href="/resume-builder" className="btn-primary">
              Create New Resume
            </Link>
          </div>
        </div>
      )}

      {/* Add Job Form Modal */}
      {showAddJobForm && (
        <AddJobForm
          onJobAdded={() => {
            setShowAddJobForm(false)
            fetchJobs() // Refresh the jobs list
          }}
          onCancel={() => setShowAddJobForm(false)}
        />
      )}
    </main>
  )
}
