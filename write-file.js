const fs = require('fs'); fs.writeFileSync('src/app/auth/page.tsx', 'use client';\n\nimport { useState } from 'react';\nimport { useRouter } from 'next/navigation';\nimport Link from 'next/link';\n\nexport default function AuthPage() {\n  const router = useRouter();\n  const [isLogin, setIsLogin] = useState(true);\n  const [email, setEmail] = useState('');\n  const [password, setPassword] = useState('');\n  const [username, setUsername] = useState('');\n  const [confirmPassword, setConfirmPassword] = useState('');\n  const [isLoading, setIsLoading] = useState(false);\n  const [error, setError] = useState('');\n\n  const handleSubmit = async (e) => {\n    e.preventDefault();\n    \n    if (!email.trim()) {\n      setError('Please enter email address');\n      return;\n    }\n    \n    if (!password) {\n      setError('Please enter password');\n      return;\n    }\n    \n    if (!isLogin) {\n      if (!username.trim()) {\n        setError('Please enter username');\n        return;\n      }\n      \n      if (password !== confirmPassword) {\n        setError('Passwords do not match');\n        return;\n      }\n    }\n    \n    setIsLoading(true);\n    setError('');\n    \n    try {\n      if (isLogin) {\n        console.log('Login info:', { email, password });\n        await new Promise(resolve => setTimeout(resolve, 1000));\n        localStorage.setItem('isLoggedIn', 'true');\n        router.push('/');\n      } else {\n        console.log('Register info:', { username, email, password });\n        await new Promise(resolve => setTimeout(resolve, 1000));\n        localStorage.setItem('isLoggedIn', 'true');\n        router.push('/');\n      }\n    } catch (err) {\n      setError(err.message || (isLogin ? 'Login failed' : 'Registration failed'));\n      console.error(isLogin ? 'Login error:' : 'Registration error:', err);\n    } finally {\n      setIsLoading(false);\n    }\n  };\n\n  return (\n    <div className=\
min-h-screen
flex
items-center
justify-center
bg-gradient-to-r
from-blue-50
to-indigo-50
p-4\>\n      <div className=\w-full
max-w-md
overflow-hidden
rounded-2xl
shadow-xl
bg-white\>\n        <div className=\px-8
pt-8
pb-6
text-center
bg-gradient-to-r
from-blue-500
to-indigo-600\>\n          <Link href=\/\>\n            <h1 className=\text-3xl
font-bold
text-white
mb-2\>ShareMeet</h1>\n          </Link>\n          <p className=\text-blue-100
text-sm\>Discover and share amazing events</p>\n        </div>\n        \n        <div className=\flex
-mt-px\>\n          <button\n            onClick={() => setIsLogin(true)}\n            className={\w-1/2 py-4 text-center \\}\n          >\n            Login\n          </button>\n          <button\n            onClick={() => setIsLogin(false)}\n            className={\w-1/2 py-4 text-center \\}\n          >\n            Register\n          </button>\n        </div>\n        \n        <div className=\px-8
py-6\>\n          <h2 className=\text-xl
font-semibold
text-gray-800
mb-6\>\n            {isLogin ? 'Welcome back' : 'Create new account'}\n          </h2>\n          \n          {error && (\n            <div className=\mb-6
p-3
rounded-lg
bg-red-50
border
border-red-100\ role=\alert\>\n              <p className=\text-red-600
text-sm\>{error}</p>\n            </div>\n          )}\n          \n          <form className=\space-y-5\ onSubmit={handleSubmit}>\n            <div className=\space-y-3\>\n              <button \n                type=\button\\n                className=\w-full
flex
items-center
justify-center
py-2.5
px-4
border
border-gray-300
rounded-lg
bg-white
hover:bg-gray-50
transition-colors\\n              >\n                <span className=\text-sm
font-medium
text-gray-700\>Sign in with WeChat</span>\n              </button>\n              <button \n                type=\button\\n                className=\w-full
flex
items-center
justify-center
py-2.5
px-4
border
border-gray-300
rounded-lg
bg-white
hover:bg-gray-50
transition-colors\\n              >\n                <span className=\text-sm
font-medium
text-gray-700\>Sign in with Weibo</span>\n              </button>\n            </div>\n            \n            <div className=\relative
flex
items-center
py-2\>\n              <div className=\flex-grow
border-t
border-gray-300\></div>\n              <span className=\flex-shrink
mx-3
text-gray-500
text-sm\>Or {isLogin ? 'login' : 'register'} with email</span>\n              <div className=\flex-grow
border-t
border-gray-300\></div>\n            </div>\n            \n            {!isLogin && (\n              <div>\n                <label htmlFor=\username\ className=\block
text-sm
font-medium
text-gray-700
mb-1\>\n                  Username\n                </label>\n                <input\n                  id=\username\\n                  name=\username\\n                  type=\text\\n                  autoComplete=\username\\n                  required\n                  value={username}\n                  onChange={(e) => setUsername(e.target.value)}\n                  className=\w-full
px-4
py-3
rounded-lg
border
border-gray-300
focus:ring-2
focus:ring-indigo-500
focus:border-indigo-500
transition-colors\\n                  placeholder=\Enter
your
username\\n                />\n              </div>\n            )}\n            \n            <div>\n              <label htmlFor=\email\ className=\block
text-sm
font-medium
text-gray-700
mb-1\>\n                Email\n              </label>\n              <input\n                id=\email\\n                name=\email\\n                type=\email\\n                autoComplete=\email\\n                required\n                value={email}\n                onChange={(e) => setEmail(e.target.value)}\n                className=\w-full
px-4
py-3
rounded-lg
border
border-gray-300
focus:ring-2
focus:ring-indigo-500
focus:border-indigo-500
transition-colors\\n                placeholder=\Enter
your
email\\n              />\n            </div>\n            \n            <div>\n              <div className=\flex
justify-between
mb-1\>\n                <label htmlFor=\password\ className=\block
text-sm
font-medium
text-gray-700\>\n                  Password\n                </label>\n                {isLogin && (\n                  <a href=\#\ className=\text-sm
font-medium
text-indigo-600
hover:text-indigo-500\>\n                    Forgot password?\n                  </a>\n                )}\n              </div>\n              <input\n                id=\password\\n                name=\password\\n                type=\password\\n                autoComplete={isLogin ? \current-password\ : \new-password\}\n                required\n                value={password}\n                onChange={(e) => setPassword(e.target.value)}\n                className=\w-full
px-4
py-3
rounded-lg
border
border-gray-300
focus:ring-2
focus:ring-indigo-500
focus:border-indigo-500
transition-colors\\n                placeholder={isLogin ? \Enter
your
password\ : \Set
your
password\}\n              />\n            </div>\n            \n            {!isLogin && (\n              <div>\n                <label htmlFor=\confirmPassword\ className=\block
text-sm
font-medium
text-gray-700
mb-1\>\n                  Confirm Password\n                </label>\n                <input\n                  id=\confirmPassword\\n                  name=\confirmPassword\\n                  type=\password\\n                  autoComplete=\new-password\\n                  required\n                  value={confirmPassword}\n                  onChange={(e) => setConfirmPassword(e.target.value)}\n                  className=\w-full
px-4
py-3
rounded-lg
border
border-gray-300
focus:ring-2
focus:ring-indigo-500
focus:border-indigo-500
transition-colors\\n                  placeholder=\Confirm
your
password\\n                />\n              </div>\n            )}\n            \n            {isLogin && (\n              <div className=\flex
items-center\>\n                <input\n                  id=\remember-me\\n                  name=\remember-me\\n                  type=\checkbox\\n                  className=\h-4
w-4
text-indigo-600
focus:ring-indigo-500
border-gray-300
rounded\\n                />\n                <label htmlFor=\remember-me\ className=\ml-2
block
text-sm
text-gray-700\>\n                  Remember me\n                </label>\n              </div>\n            )}\n            \n            <div>\n              <button\n                type=\submit\\n                disabled={isLoading}\n                className=\w-full
flex
justify-center
py-3
px-4
rounded-lg
shadow-sm
text-white
font-medium
bg-gradient-to-r
from-blue-600
to-indigo-600
hover:from-blue-700
hover:to-indigo-700
focus:outline-none
focus:ring-2
focus:ring-offset-2
focus:ring-indigo-500
transition-colors\\n              >\n                {isLoading \n                  ? (isLogin ? 'Logging in...' : 'Registering...') \n                  : (isLogin ? 'Login' : 'Register')}\n              </button>\n            </div>\n          </form>\n          \n          <div className=\mt-6
text-center\>\n            <Link href=\/\ className=\text-sm
text-gray-600
hover:text-indigo-500\>\n              Back to home\n            </Link>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}, { encoding: 'utf8' });
