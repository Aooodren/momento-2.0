import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Search, 
  Filter, 
  Calendar, 
  MessageCircle,
  MoreHorizontal,
  User,
  MapPin,
  Smartphone,
  Shield,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";

interface ShareProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
  tags: string[];
  age: string;
  gender: string;
  location: string;
  device: string;
  lastActive: string;
  isOnline: boolean;
}

const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Oliver Taylor',
    email: 'olivertaylor@mail.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    status: 'active',
    role: 'Owner',
    tags: ['Membership Program'],
    age: '32 y/o',
    gender: 'Male',
    location: 'San Francisco',
    device: 'Desktop',
    lastActive: 'Now',
    isOnline: true
  },
  {
    id: '2',
    name: 'Sarah Butler',
    email: 'sarahbutler@mail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=100&h=100&fit=crop&crop=face',
    status: 'active',
    role: 'Editor',
    tags: ['Premium User'],
    age: '28 y/o',
    gender: 'Female',
    location: 'New York',
    device: 'Mobile',
    lastActive: '2h ago',
    isOnline: false
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: 'emmathompson@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    status: 'active',
    role: 'Viewer',
    tags: ['Membership Program', 'Other Tag'],
    age: '46 y/o',
    gender: 'Female',
    location: 'New York',
    device: 'Control',
    lastActive: 'Jun 25, 2024',
    isOnline: true
  },
  {
    id: '4',
    name: 'Jane Doe',
    email: 'janedoe@mail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    status: 'pending',
    role: 'Viewer',
    tags: ['New Member'],
    age: '24 y/o',
    gender: 'Female',
    location: 'Boston',
    device: 'Desktop',
    lastActive: '1d ago',
    isOnline: false
  }
];

export default function ShareProjectDialog({ isOpen, onClose, projectTitle }: ShareProjectDialogProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(mockMembers[2]); // Emma Thompson par défaut
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = mockMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">
            Partager "{projectTitle}"
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Gérez les membres et les permissions d'accès à ce projet
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[700px]">
          {/* Section gauche - Recent Members */}
          <div className="w-96 border-r border-border bg-muted/30">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-muted-foreground">Recent Members</h3>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un membre..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <ScrollArea className="h-[580px]">
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {member.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Section droite - Member Details */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-muted-foreground">Members Assigned</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            {selectedMember && (
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl">
                  {/* En-tête du membre */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                          <AvatarFallback>{selectedMember.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {selectedMember.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">{selectedMember.name}</h2>
                        <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedMember.status)}`}></div>
                        <span className="text-sm font-medium text-green-600">
                          {getStatusText(selectedMember.status)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Next: {selectedMember.lastActive}
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-3 mb-8">
                    {selectedMember.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant={index === 0 ? "default" : "secondary"}
                        className={index === 0 ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Informations personnelles */}
                  <div className="grid grid-cols-5 gap-8 mb-8">
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Age</div>
                      <div className="font-medium">{selectedMember.age}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Sex</div>
                      <div className="font-medium">{selectedMember.gender}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Location</div>
                      <div className="font-medium">{selectedMember.location}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Active Device</div>
                      <div className="font-medium">{selectedMember.device}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
                      <div className="font-medium">Confirmed</div>
                    </div>
                  </div>

                  <Separator className="mb-8" />

                  {/* Actions rapides */}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-4">Quick Actions</div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Appointments
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Chat
                        <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                          2
                        </Badge>
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button>
              Inviter les membres
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}