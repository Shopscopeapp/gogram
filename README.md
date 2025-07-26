# 🏗️ Gogram - Construction Program Management Platform

Gogram is a modern, user-friendly construction program management platform designed specifically for construction workers, project managers, coordinators, and suppliers. Built with a focus on simplicity and effectiveness, Gogram provides powerful scheduling and coordination tools without overwhelming complexity.

## ✨ Features

### 🔧 Core Functionality
- **Live Program Scheduling Engine**: Drag-and-drop program builder with clean visual interface
- **Task Dependencies**: Automatic task shifting when predecessor tasks are moved
- **Role-Based Permissions**: Granular access control for different user types
- **Real-time Collaboration**: Live updates across all connected users

### 🔄 Collaborative Program Changes
- **Change Proposal System**: Coordinators and subcontractors can propose schedule changes
- **Approval Workflow**: Project managers review and approve/reject all changes
- **Change History**: Complete audit trail of all program modifications

### 📊 Project Tracking
- **Planned vs Actual**: Track planned vs actual durations for all tasks
- **Delay Analysis**: Automatic delay calculation and reporting (PM only)
- **Progress Monitoring**: Real-time project progress visualization

### 📤 External Sharing
- **Public Links**: Share read-only program views with external stakeholders
- **Privacy Controls**: Procurement details hidden from public view
- **Real-time Updates**: External viewers see live schedule progress

### 📦 Procurement Management
- **Supplier Integration**: Link tasks to suppliers and deliveries
- **Automatic Notifications**: Email suppliers when delivery dates change
- **Confirmation System**: Suppliers can confirm/reject delivery changes
- **Visual Status**: Color-coded delivery confirmations

### 🛠️ User Roles

#### Project Manager
- Full program edit access
- Approval authority for all changes
- Access to delay logs and analytics
- Can generate public share links
- Manage team members and suppliers

#### Project Coordinator
- Suggest schedule changes
- Receive QA/ITP alerts
- Assist with procurement management
- View most project data

#### Subcontractor
- View relevant project schedules
- Propose changes to their tasks
- Confirm delivery movements
- Access to task dependencies

#### Supplier
- Confirm or reject delivery date changes
- View linked task schedules
- Receive automated notifications
- Update delivery status

#### Viewer
- Read-only access to public project information
- No access to procurement details
- View progress and schedules only

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit
- **Build Tool**: Vite
- **Notifications**: React Hot Toast

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gogram
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Demo Mode

The application includes a comprehensive demo mode with:
- Sample construction project data
- Multiple user roles to test
- Realistic task dependencies
- Mock supplier and delivery data

Simply select any role on the login screen to explore the features.

## 📱 Mobile-First Design

Gogram is designed mobile-first with construction site usage in mind:
- **Touch-friendly**: Large buttons and touch targets
- **Readable**: High contrast, clear typography
- **Fast**: Optimized for slower connections
- **Intuitive**: Construction worker-friendly interface
- **Responsive**: Works on phones, tablets, and desktop

## 🎨 Design Philosophy

### For Construction Workers
- **Simple Navigation**: Clear, labeled sections
- **Visual Clarity**: Color-coded priorities and statuses
- **Quick Actions**: Essential functions prominently displayed
- **Minimal Clicks**: Streamlined workflows
- **Error Prevention**: Clear confirmations and validations

### Modern UX Principles
- **Progressive Disclosure**: Show relevant information when needed
- **Consistent Patterns**: Uniform interactions throughout
- **Immediate Feedback**: Real-time visual feedback
- **Accessible**: WCAG-compliant design patterns
- **Performance**: Smooth animations and fast load times

## 🔐 Security & Permissions

- **Role-based Access Control**: Granular permissions by user role
- **Audit Logging**: All actions tracked for transparency
- **Secure Sharing**: Public links with limited access
- **Data Privacy**: Sensitive information protected by role

## 📈 Future Roadmap

### Phase 2 Features
- **QA/ITP Automation**: Automatic quality assurance alerts
- **Calendar Integration**: Outlook/Google Calendar sync
- **Advanced Reporting**: Custom report builder
- **Mobile Apps**: Native iOS/Android applications

### Phase 3 Integrations
- **Procore Integration**: Sync with existing construction software
- **Aconex Connector**: Document management integration
- **Buildxact API**: Cost management synchronization
- **Advanced Analytics**: Machine learning insights

## 🤝 Contributing

We welcome contributions from the construction and development communities!

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- TypeScript strict mode
- ESLint configuration included
- Prettier for code formatting
- Conventional commits

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, questions, or feature requests:
- Create an issue on GitHub
- Email: support@gogram.app
- Documentation: [docs.gogram.app](https://docs.gogram.app)

## 🙏 Acknowledgments

- Built for construction workers by construction experts
- Inspired by real-world construction project challenges
- Designed with feedback from project managers and coordinators
- Special thanks to the construction industry professionals who provided input

---

**Gogram** - Making construction project management simple, visual, and effective. 🏗️ 